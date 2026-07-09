# Guide de démarrage

## 1. Créer le projet Firebase

1. Aller sur https://console.firebase.google.com
2. Créer un nouveau projet
3. Activer :
   - **Firestore Database** (mode production)
   - **Authentication** → Email/Mot de passe
   - **Storage**
   - **Functions** (nécessite plan Blaze)
   - **Hosting**

## 2. Configurer les variables d'environnement

Copier `.env.example` en `.env` et remplir avec vos vraies clés Firebase :

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 3. Créer le compte admin dans Firebase Auth

1. Dans Firebase Console → Authentication → Ajouter un utilisateur (email/mot de passe)
2. Dans Firestore → créer la collection `utilisateurs` → document avec l'UID de l'admin → champ `role: "admin"`

## 4. Configurer CallMeBot (notifications WhatsApp)

1. Depuis votre WhatsApp, envoyer un message à **+34 644 60 49 23** :
   ```
   I allow callmebot to send me messages
   ```
2. Vous recevrez une `apiKey`
3. Dans Firestore → `parametres/config` → ajouter le champ `callmebotApiKey: "VOTRE_CLE"`
4. Le champ `whatsappAdmin` doit être au format international sans `+` (ex: `2250700000000`)

## 5. Lancer en développement

```bash
cd livraison-app
npm run dev
```

## 6. Déployer sur Firebase Hosting

```bash
# Installer Firebase CLI si pas encore fait
npm install -g firebase-tools

# Se connecter
firebase login

# Configurer votre project ID dans .firebaserc
# (remplacer "VOTRE_PROJECT_ID" par votre vrai ID)

# Build + déploiement
npm run build
firebase deploy
```

## 7. Déployer les Cloud Functions

```bash
cd functions
# Puis depuis la racine :
firebase deploy --only functions
```

## Structure des rôles

- **Admin** : connecté via Firebase Auth, document `utilisateurs/{uid}` avec `role: "admin"`
- **Livreur** : créé par l'admin depuis l'interface `/admin/livreurs`, document auto-créé
- **Client** : aucune connexion requise (accès public)

## Flux de statut commande

```
en_attente → confirmée → prête_livraison → en_livraison → livrée
                                ↓
                    (visible espace livreur)
```
