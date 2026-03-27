# Deploying Tabs Web App to Vercel

This guide walks you through deploying the Tabs web app from zero to live on a `*.vercel.app` URL (free, no credit card required).

---

## Step 1 — Register the Web App in Firebase

Before anything else, you need a **Web App ID** from your existing Firebase project.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and open project **tabs-74415**.
2. Click the **gear icon** (Project Settings) in the left sidebar.
3. Scroll to the **"Your apps"** section and click **"Add app"** → choose the **`</>`** (Web) icon.
4. Give it a nickname like `Tabs Web` and click **Register app**.
5. Firebase will show you a config object. Copy the **`appId`** value — it looks like `1:123456789:web:abcdef123456`.
6. Open `src/firebase/config.ts` in the `tabs-web` folder and replace `REPLACE_WITH_WEB_APP_ID` with the value you just copied.

```ts
// src/firebase/config.ts — update this line:
appId: "1:YOUR_PROJECT_NUMBER:web:YOUR_WEB_APP_ID",
```

---

## Step 2 — Enable Auth Providers for the Web

Still in Firebase Console → **Authentication** → **Sign-in method**:

### Google Sign-In
- It should already be enabled (shared with iOS). If not, enable it and add your support email.

### Apple Sign-In (optional but recommended)
Apple Sign-In for web requires extra configuration in the Apple Developer portal:

1. Go to [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles** → **Identifiers**.
2. Click **+** → choose **Services IDs** → Continue.
3. Description: `Tabs Web`, Identifier: `com.yourname.tabs.web` (must be unique) → Continue → Register.
4. Click the new Service ID → enable **Sign in with Apple** → Configure.
5. Set **Primary App ID** to your iOS app's Bundle ID (e.g. `com.yourname.Tabs`).
6. Add your Vercel domain as a **Web Domain** (you'll get this in Step 5 — come back here after).
7. Add `https://your-app.vercel.app/__/auth/handler` as a **Return URL**.
8. Back in Firebase Console → Authentication → Apple → paste in your **Services ID** and the **private key** from Apple Developer.

> **Tip:** You can skip Apple Sign-In for now and add it after deployment.

---

## Step 3 — Push the Code to GitHub

Vercel deploys from a Git repository. If you don't have Git installed, download it from [git-scm.com](https://git-scm.com).

```bash
# Navigate to the tabs-web folder
cd /path/to/tabs-web

# Initialize a git repo
git init
git add .
git commit -m "Initial commit — Tabs web app"
```

Now create a repository on GitHub:

1. Go to [github.com/new](https://github.com/new).
2. Name it `tabs-web`, set it to **Private** (recommended — your Firebase config is in the source).
3. Click **Create repository**.
4. Follow the "push an existing repository" commands GitHub shows you:

```bash
git remote add origin https://github.com/YOUR_USERNAME/tabs-web.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in with your GitHub account (free).
2. Click **"Add New Project"**.
3. Find `tabs-web` in the repository list and click **Import**.
4. Vercel auto-detects **Vite** — the settings should be pre-filled:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Click **Deploy**.

Vercel will install dependencies, build the project, and give you a live URL like `https://tabs-web-abc123.vercel.app`. This takes about 60–90 seconds.

---

## Step 5 — Add Authorized Domains in Firebase Auth

Firebase blocks sign-in attempts from unknown domains. You need to whitelist your Vercel URL.

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**.
2. Click **Add domain** and add:
   - `tabs-web-abc123.vercel.app` (your exact Vercel URL)
   - Any custom domain you set up later

Without this step, Google/Apple sign-in will show an "unauthorized domain" error.

---

## Step 6 — Set Up a Custom Domain (Optional)

Vercel gives you a free `*.vercel.app` subdomain. If you want a custom domain like `tabs.app`:

1. In Vercel dashboard → your project → **Settings** → **Domains**.
2. Click **Add** and type your domain.
3. Vercel will show you DNS records to add — go to your domain registrar (Namecheap, Cloudflare, GoDaddy, etc.) and add the CNAME or A record as shown.
4. Once DNS propagates (5 min – 24 hrs), Vercel auto-provisions an SSL certificate.
5. Add the custom domain to Firebase Auth authorized domains (Step 5 above).

> **Free domain options:** Vercel's `*.vercel.app` subdomain is completely free. For a paid custom domain, `.com` domains cost ~$10/yr on Namecheap or Cloudflare Registrar.

---

## Step 7 — Automatic Deployments

Every time you push to the `main` branch on GitHub, Vercel automatically rebuilds and deploys. No manual steps needed.

Pull requests also get **preview deployments** at unique URLs — great for testing changes before they go live.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `unauthorized_domain` on sign-in | Add your Vercel URL to Firebase Auth → Authorized domains |
| Blank page after deploy | Check browser console; usually a missing `appId` in `config.ts` |
| Build fails: "Cannot find module" | Run `npm install` locally first; make sure `package-lock.json` is committed |
| Apple Sign-In not working | Complete Step 2 Apple configuration; Apple requires a real domain (not localhost) |
| Old data not loading | Check Firebase Firestore rules — web uses the same database as iOS |

---

## Firestore Security Rules (Important)

Your iOS app likely has Firestore security rules that restrict access. Make sure they allow authenticated web users. In Firebase Console → **Firestore Database** → **Rules**, your rules should look something like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows any signed-in user (iOS or web) to read/write. You can tighten these rules later based on user IDs or custom claims.

---

## Summary Checklist

- [ ] Added web app in Firebase → copied `appId` into `config.ts`
- [ ] Google Sign-In authorized domain added in Firebase Auth
- [ ] Code pushed to GitHub
- [ ] Project imported into Vercel and deployed
- [ ] Vercel URL added to Firebase Auth authorized domains
- [ ] (Optional) Custom domain configured
- [ ] (Optional) Apple Sign-In Services ID configured

Once the checklist is complete, your web app is live and stays in sync with your iOS app's Firestore data in real time.
