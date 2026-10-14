# 🔐 Guide Complet : Génération d'APK Signé & Publication GitHub Releases

Si vous ne voyez pas encore d'APK dans l'onglet **Releases** de votre dépôt GitHub, voici **exactement pourquoi** et **les 2 étapes rapides** pour que GitHub le génère et le publie immédiatement.

---

## ⚡ Pourquoi l'APK n'était pas dans l'onglet Releases ?

1. **Absence de déclenchement ou de Tag Git** :  
   Les workflows GitHub Releases ne publiaient que si un Tag Git (`v*`) était poussé ou si l'option était cochée manuellement. L'APK était alors stocké dans l'onglet **Actions > Artifacts** (téléchargeable en ZIP) mais pas encore dans **Releases**.
   👉 **C'est désormais corrigé :** Le workflow `.github/workflows/build-apk.yml` publie maintenant **automatiquement dans GitHub Releases** à chaque push sur `main`/`master`, à chaque tag `v*`, et à chaque clic sur *Run workflow* !

2. **Permission d'écriture GitHub Actions (CRITIQUE)** :  
   Par défaut sur GitHub, les workflows n'ont souvent que la permission "Lecture seule". Pour que GitHub Actions puisse créer une Release et y déposer l'APK, il faut autoriser l'écriture (voir Étape 1 ci-dessous).

---

## 🛠️ Étape 1 : Activer la permission d'écriture GitHub Actions (1 clic)

1. Rendez-vous sur votre dépôt : `https://github.com/Connacri/CyberScrape`
2. Cliquez sur l'onglet **Settings** (Paramètres du dépôt).
3. Dans le menu de gauche, allez dans **Actions** > **General**.
4. Descendez jusqu'à la section **Workflow permissions**.
5. Cochez : **`Read and write permissions`** (Lire et écrire).
6. Cochez également : **`Allow GitHub Actions to create and approve pull requests`**.
7. Cliquez sur **Save**.

---

## 🚀 Étape 2 : Déclencher la création de la Release avec l'APK Signé

Vous avez **2 méthodes très simples** :

### Méthode A : En 1 clic depuis l'interface GitHub (Sans ligne de commande)
1. Allez sur votre dépôt GitHub dans l'onglet **Actions** :  
   `https://github.com/Connacri/CyberScrape/actions`
2. Dans la colonne de gauche, cliquez sur le workflow :  
   **`Build & Sign Android APK (CYBER-VACUUM)`**
3. À droite, cliquez sur le bouton gris déroulant **`Run workflow`**.
4. Laissez les options par défaut et cliquez sur le bouton vert **`Run workflow`**.
5. Le build va s'exécuter (~3 à 5 minutes). Dès qu'il est terminé :
   - Rendez-vous dans l'onglet **Releases** (`https://github.com/Connacri/CyberScrape/releases`) : votre APK signé `CyberVacuum-v1.0.X-signed-release.apk` s'y trouve, prêt à être téléchargé et installé !

### Méthode B : En poussant un Tag Git depuis votre terminal
```bash
git tag v1.0.0
git push origin v1.0.0
```
Le push du tag déclenche automatiquement la compilation, la signature avec votre Keystore et la publication de la Release officielle sur GitHub.

---

## 📦 Fichiers générés dans la Release GitHub

Une fois le workflow terminé, votre Release contiendra :
1. **`CyberVacuum-v1.0.X-signed-release.apk`** : L'APK officiel signé, installable sur n'importe quel smartphone Android (7.0+).
2. **`CyberVacuum-v1.0.X-debug.apk`** : La version de debug.
3. **`CyberVacuum-v1.0.X-WebBundle.zip`** : L'archive web complète.
4. **`SHA256SUMS.txt`** : Les empreintes de contrôle cryptographiques certifiant l'authenticité de l'APK.

---

## 🔑 Rappel des Secrets GitHub (Optionnel si vous avez votre propre Keystore)

Si vous souhaitez utiliser votre propre clé de signature Android de production au lieu de la clé auto-générée par le workflow, ajoutez ces 4 secrets dans **Settings > Secrets and variables > Actions** :

- **`ANDROID_KEYSTORE_BASE64`** : Votre fichier `.keystore` encodé en base64 (`base64 -w 0 mon-fichier.keystore > key.txt`).
- **`KEYSTORE_PASSWORD`** : Le mot de passe du keystore.
- **`KEY_ALIAS`** : Le nom de l'alias de la clé.
- **`KEY_PASSWORD`** : Le mot de passe de l'alias.
- **`GEMINI_API_KEY`** : Votre clé d'API Gemini AI.
- **`VITE_SUPABASE_URL`** : URL Supabase.
- **`VITE_SUPABASE_ANON_KEY`** : Clé publique Supabase.
