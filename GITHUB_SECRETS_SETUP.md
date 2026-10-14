# 🔐 Guide de Configuration des Variables Secrets GitHub (CI/CD & APK Signé)

Ce document décrit en détail les **GitHub Actions Secrets** à renseigner dans votre dépôt GitHub (`Settings > Secrets and variables > Actions`) pour activer la signature cryptographique automatique des APK Android, la publication sur GitHub Releases et la connexion aux API backend.

---

## 📋 Résumé des Secrets GitHub Supportés

| Nom du Secret GitHub | Description | Requis / Optionnel |
| :--- | :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | Contenu encodé en base64 de votre fichier de clé `.keystore` ou `.jks` | **Recommandé pour APK signé officiel** (fallback auto si absent) |
| `KEYSTORE_PASSWORD` | Mot de passe du keystore Android | Optionnel (défaut: `cybervacuum123`) |
| `KEY_ALIAS` | Alias de la clé privée de signature | Optionnel (défaut: `cybervacuum`) |
| `KEY_PASSWORD` | Mot de passe de l'alias de signature | Optionnel (défaut: `KEYSTORE_PASSWORD`) |
| `GEMINI_API_KEY` | Clé d'API Google Gemini AI (pour le mode d'aspiration IA avancé) | Optionnel (le mode Direct fonctionne sans clé) |
| `VITE_SUPABASE_URL` | URL de votre instance Supabase | Optionnel (peut être configuré directement dans l'UI) |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anonyme Supabase | Optionnel (peut être configuré directement dans l'UI) |

---

## 🛠️ 1. Générer et Configurer le Keystore Android

### Étape 1 : Générer un fichier Keystore en local (sur votre machine)
Exécutez cette commande dans votre terminal :

```bash
keytool -genkey -v \
  -keystore cybervacuum-release.keystore \
  -alias cybervacuum \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass MonSuperMotDePasse123 \
  -keypass MonSuperMotDePasse123 \
  -dname "CN=CyberVacuum, OU=Mobile, O=CyberVacuum, L=Algiers, C=DZ"
```

### Étape 2 : Encoder le fichier en Base64
Convertissez le fichier keystore binaire en chaîne de caractères Base64 :

- **Sur Linux / macOS / WSL :**
  ```bash
  base64 -w 0 cybervacuum-release.keystore > keystore_base64.txt
  # Sur macOS si -w 0 n'est pas supporté :
  base64 -i cybervacuum-release.keystore -o keystore_base64.txt
  ```

- **Sur Windows (PowerShell) :**
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("cybervacuum-release.keystore")) | Out-File -Encoding ASCII keystore_base64.txt
  ```

### Étape 3 : Ajouter les Secrets dans GitHub
1. Allez sur votre dépôt GitHub : `https://github.com/Connacri/CyberScrape`
2. Cliquez sur **Settings** (Paramètres du dépôt).
3. Dans la barre latérale gauche, cliquez sur **Secrets and variables** > **Actions**.
4. Cliquez sur le bouton vert **New repository secret**.
5. Ajoutez les secrets suivants :
   - **`ANDROID_KEYSTORE_BASE64`** : Collez l'intégralité du contenu du fichier `keystore_base64.txt`.
   - **`KEYSTORE_PASSWORD`** : Le mot de passe choisi (ex: `MonSuperMotDePasse123`).
   - **`KEY_ALIAS`** : Le nom de l'alias (ex: `cybervacuum`).
   - **`KEY_PASSWORD`** : Le mot de passe de l'alias (ex: `MonSuperMotDePasse123`).

> ℹ️ **Note sur le Fallback automatique :**  
> Si vous n'avez pas encore renseigné `ANDROID_KEYSTORE_BASE64`, le workflow GitHub Actions génère automatiquement une clé valide à la volée pour que la compilation ne plante jamais. Dès que vous ajoutez votre secret, il bascule instantanément sur votre clé officielle !

---

## 🌐 2. Configurer les Clés API (Gemini & Supabase)

Dans la même section **Secrets and variables** > **Actions**, ajoutez :

1. **`GEMINI_API_KEY`** : Votre clé d'API Google Gemini (obtenue sur Google AI Studio).
2. **`VITE_SUPABASE_URL`** : L'URL de votre projet Supabase (ex: `https://xyzcompany.supabase.co`).
3. **`VITE_SUPABASE_ANON_KEY`** : La clé anonyme `anon` `public` de Supabase.

---

## 🚀 3. Comment Déclencher la Publication d'une Release avec APK Signé

### Méthode A : En poussant un Tag Git (Recommandé)
Chaque fois que vous créez et poussez un tag commençant par `v`, GitHub compile l'application web, assemble et signe l'APK Android avec votre Keystore, génère les sommes de contrôle SHA-256 et publie automatiquement le tout dans les **Releases** de votre dépôt GitHub !

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Méthode B : Déclenchement Manuel dans GitHub Actions
1. Allez dans l'onglet **Actions** de votre dépôt.
2. Sélectionnez le workflow **Build & Sign Android APK (CYBER-VACUUM)**.
3. Cliquez sur **Run workflow**.
4. Cochez la case **Publish Signed APK to GitHub Releases?** et validez.
