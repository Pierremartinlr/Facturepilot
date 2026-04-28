// api/subscribe.js — Vercel Serverless Function
// Gère la collecte d'emails et l'envoi via Resend
//
// Variables d'environnement à configurer sur Vercel :
//   RESEND_API_KEY  → votre clé Resend (re_xxxxxxxxxxxx)
//   ADMIN_EMAIL     → votre email pour recevoir les notifications (ex: vous@facturepilot.io)

const { Resend } = require('resend');

// ─── Template email de bienvenue ───────────────────────────────────────────
function getWelcomeHTML(email) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bienvenue sur FacturePilot</title>
</head>
<body style="margin:0;padding:0;background:#f6f2ec;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fffefb;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(17,17,16,.08)">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0a2d18,#1a5c36);padding:32px 36px;text-align:center">
      <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em">
          Facture<span style="color:#e8a020">Pilot</span><span style="color:#e8a020;font-size:30px">.</span>
        </div>
      </div>
      <div style="display:inline-block;background:rgba(232,160,32,.2);border:1px solid rgba(232,160,32,.4);color:#e8a020;border-radius:99px;padding:5px 14px;font-size:12px;font-weight:700;letter-spacing:.04em">
        ✓ ESSAI GRATUIT ACTIVÉ — 7 JOURS
      </div>
    </div>

    <!-- Body -->
    <div style="padding:36px 36px 28px">
      <h1 style="font-size:26px;font-weight:700;color:#111110;letter-spacing:-.02em;margin:0 0 10px">
        Bienvenue dans FacturePilot&nbsp;! 🎉
      </h1>
      <p style="font-size:15px;color:#7a7570;line-height:1.7;margin:0 0 28px">
        Votre accès gratuit est activé pour <strong style="color:#111110">7 jours complets</strong>.<br>
        Voici ce que vous pouvez faire dès maintenant :
      </p>

      <!-- Features -->
      <div style="background:#f6f2ec;border-radius:12px;padding:20px;margin-bottom:28px">
        ${[
          ['📄', 'Créer des factures professionnelles', 'Conformes, TVA automatique, aperçu live'],
          ['📋', 'Générer des devis avec acompte', 'Envoi WhatsApp, email ou SMS intégré'],
          ['🤖', 'Contrats IA en 60 secondes', 'Freelance, NDA, CGV — rédigés par IA'],
          ['🔔', 'Relances automatiques', 'J+3, J+7, J+14 — -68% de retards de paiement'],
        ].map(([ico, title, desc]) => `
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
          <div style="font-size:20px;flex-shrink:0;width:28px;text-align:center">${ico}</div>
          <div>
            <div style="font-size:13.5px;font-weight:700;color:#111110;margin-bottom:2px">${title}</div>
            <div style="font-size:12px;color:#7a7570">${desc}</div>
          </div>
        </div>`).join('')}
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px">
        <a href="https://facturepilot.com" style="display:inline-block;background:#1a5c36;color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:-.01em">
          Accéder à FacturePilot →
        </a>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:28px">
        ${[['48%','freelances ont des impayés'],['18j','retard moyen'],['−68%','avec FacturePilot']].map(([n, l]) => `
        <div style="text-align:center;padding:14px 10px;background:#e8f4ec;border-radius:10px">
          <div style="font-size:22px;font-weight:800;color:#1a5c36">${n}</div>
          <div style="font-size:10px;color:#7a7570;margin-top:3px">${l}</div>
        </div>`).join('')}
      </div>

      <p style="font-size:13px;color:#7a7570;line-height:1.7;border-top:1px solid #e0dbd2;padding-top:20px">
        Une question ? Répondez directement à cet email ou contactez-nous à 
        <a href="mailto:support@facturepilot.io" style="color:#1a5c36;font-weight:600">support@facturepilot.io</a>.<br>
        Après 7 jours, Pro à <strong>€19/mois</strong> — annulez en 1 clic, sans condition.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f6f2ec;padding:20px 36px;text-align:center;border-top:1px solid #e0dbd2">
      <p style="font-size:11px;color:#b0a99f;margin:0">
        © 2025 FacturePilot SAS · Paris, France · RGPD · Données 100% privées<br>
        Vous recevez cet email car vous avez créé un compte avec <strong>${email}</strong>.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Notification admin ────────────────────────────────────────────────────
function getAdminHTML(email, source, timestamp) {
  return `
<div style="font-family:monospace;padding:20px;background:#0a2d18;color:#7dd5a4;border-radius:8px">
  <div style="font-size:18px;margin-bottom:16px">🎯 Nouveau lead FacturePilot</div>
  <div><strong>Email :</strong> ${email}</div>
  <div><strong>Source :</strong> ${source || 'direct'}</div>
  <div><strong>Date :</strong> ${timestamp}</div>
  <div style="margin-top:16px;font-size:12px;color:#b8ddc5">facturepilot.com</div>
</div>`;
}

// ─── Handler principal ─────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source, timestamp } = req.body || {};

  // Validation
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'support@facturepilot.io';

  if (!apiKey) {
    // Pas de clé Resend configurée → retourner succès quand même (mode dev)
    console.log('[FacturePilot] Lead (mode dev - pas de RESEND_API_KEY) :', email, '| Source :', source);
    return res.status(200).json({ success: true, method: 'dev-mode', email });
  }

  try {
    const resend = new Resend(apiKey);
    const now = timestamp || new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

    // 1. Email de bienvenue → utilisateur
    await resend.emails.send({
      from: 'FacturePilot <hello@facturepilot.io>',
      to: email,
      subject: '🎉 Votre accès FacturePilot est activé — 7 jours gratuits',
      html: getWelcomeHTML(email),
    });

    // 2. Notification → admin
    await resend.emails.send({
      from: 'FacturePilot Leads <noreply@facturepilot.io>',
      to: adminEmail,
      subject: `[Lead] ${email} — source: ${source || 'direct'}`,
      html: getAdminHTML(email, source, now),
    });

    console.log('[FacturePilot] Emails envoyés via Resend :', email);
    return res.status(200).json({ success: true, method: 'resend', email });

  } catch (err) {
    console.error('[FacturePilot] Erreur Resend :', err.message);
    // On ne bloque pas l'utilisateur si l'email échoue
    return res.status(200).json({ success: true, method: 'fallback', error: err.message });
  }
};
