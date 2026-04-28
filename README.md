# FacturePilot — Déploiement Vercel

## Structure du repo (4 fichiers uniquement)

```
facturepilot/
├── index.html          ← votre app complète (existant)
├── package.json        ← ✨ nouveau
├── vercel.json         ← ✨ nouveau
└── api/
    └── subscribe.js    ← ✨ nouveau (endpoint email)
```

---

## Étapes de déploiement

### 1. Ajouter les fichiers à votre repo GitHub

```bash
# Dans votre repo local
git add package.json vercel.json api/subscribe.js
git commit -m "feat: add Vercel backend + Resend email integration"
git push origin main
```

### 2. Configurer les variables d'environnement sur Vercel

Sur **vercel.com → votre projet → Settings → Environment Variables** :

| Variable | Valeur |
|---|---|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` (depuis resend.com) |
| `ADMIN_EMAIL` | `vous@facturepilot.io` |

### 3. Créer votre clé Resend (gratuit)

1. Aller sur **resend.com** → créer un compte
2. **Domains** → ajouter `facturepilot.io` → suivre les DNS
3. **API Keys** → créer une clé → copier dans Vercel

### 4. Redéployer

Vercel redéploie automatiquement à chaque `git push`.
Ou manuellement : **Vercel → Deployments → Redeploy**.

---

## Test local

```bash
npm install -g vercel
vercel dev
# → http://localhost:3000
```

---

## Ce que fait `api/subscribe.js`

Quand un utilisateur entre son email sur le site :

1. **Email de bienvenue** → envoyé à l'utilisateur (HTML professionnel)
2. **Notification admin** → envoyée à votre adresse
3. **Log console** → visible dans Vercel Functions logs

Si `RESEND_API_KEY` n'est pas configurée → mode dev (log uniquement, pas de blocage).

---

## Sécurité

- Clé API Resend **côté serveur uniquement** (jamais exposée dans le HTML)
- Validation email côté serveur
- CORS configuré
- Pas de données stockées côté serveur (RGPD by design)
