# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # Development with nodemon auto-reload
npm start      # Production start (note: package.json has bug — "nodesrc/server.js" should be "node src/server.js")
```

No test framework is configured yet (`npm test` exits with error).

## Stack & versions
- Runtime : Node.js 20+
- Framework : Express.js 5.x
- Base de données : MongoDB 7+ via Mongoose 9+
- Auth : JWT (access token 15min + refresh token 7j)
- Realtime : Socket.io 4.x (planned — not yet installed)
- Upload : Multer (memoryStorage) + Cloudinary SDK v2 (planned — not yet installed)
- Paiement : Stripe SDK (planned — not yet installed)
- Push : expo-server-sdk — PAS firebase-admin (planned — not yet installed)
- Validation : express-validator
- Sécurité : bcryptjs, helmet, cors, express-rate-limit
- Env : dotenv

## Current state vs planned structure

Only `src/server.js` and `src/config/db.js` exist currently. The structure below is the **target architecture**:

```
src/
├── config/
│   ├── db.js               # connexion Mongoose
│   ├── cloudinary.js       # config Cloudinary
│   ├── expo.js             # instance expo-server-sdk
│   └── stripe.js           # instance Stripe
├── models/
│   ├── User.js
│   ├── Like.js
│   ├── Match.js
│   ├── Message.js
│   └── Prompt.js
├── controllers/            # logique métier — appelés par les routes
│   ├── auth.controller.js
│   ├── profile.controller.js
│   ├── discover.controller.js
│   ├── matches.controller.js
│   └── payment.controller.js
├── routes/                 # routing uniquement — pas de logique ici
│   ├── auth.route.js
│   ├── profile.route.js
│   ├── discover.route.js
│   ├── matches.route.js
│   └── payment.route.js
├── middleware/
│   ├── auth.middleware.js             # authMiddleware JWT
│   ├── checkPlan.middleware.js        # checkPlan() + checkLikeLimit()
│   ├── rateLimiter.middleware.js
│   └── errorHandler.middleware.js     # handler global
├── services/
│   ├── notificationService.js  # expo-server-sdk
│   └── matchService.js
├── socket/
│   └── index.js            # handlers Socket.io
├── utils/
│   ├── jwt.js
│   └── profileScore.js
└── server.js
```

## Convention routes ↔ controllers
- Les fichiers `routes/` contiennent **uniquement** la déclaration des routes + middlewares
- Toute la logique métier est dans `controllers/`
- Exemple :
```js
// routes/auth.js
const { register, login, refresh, logout } = require('../controllers/auth.controller')
router.post('/register', validateRegister, register)
router.post('/login', validateLogin, login)

// controllers/auth.controller.js
exports.register = async (req, res, next) => {
  try {
    // logique complète ici
  } catch (err) { next(err) }
}
```
- Les controllers appellent les services (notificationService, matchService)
- Les services ne connaissent pas req/res — ils prennent des paramètres métier purs

## Conventions de code
- async/await partout, jamais de callbacks
- Tous les handlers de routes wrappés dans try/catch
- Format de réponse uniforme : `{ success: boolean, data?: any, error?: string }`
- Nommage : camelCase variables/fonctions, PascalCase modèles Mongoose
- express-validator sur TOUTES les routes POST/PUT avant de toucher la DB
- Ne jamais retourner le passwordHash : `.select('-passwordHash')`
- IDs MongoDB dans les réponses : toujours castés en string

## Modèles Mongoose — schémas

### User.js
```js
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  age: { type: Number, required: true, min: 18 },
  gender: { type: String, enum: ['man', 'woman', 'nonbinary'] },
  photos: [{ url: String, publicId: String, order: Number }], // max 6
  prompts: [{ question: String, answer: String }],            // exactement 3
  bio: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]   // [longitude, latitude] — longitude EN PREMIER
  },
  job: String,
  education: String,
  height: Number,
  religion: String,
  preferences: {
    genderPreference: [String],
    ageMin: { type: Number, default: 18 },
    ageMax: { type: Number, default: 45 },
    maxDistance: { type: Number, default: 50 }  // km
  },
  subscription: {
    plan: { type: String, enum: ['free', 'plus', 'x'], default: 'free' },
    status: { type: String, default: 'inactive' },
    stripeCustomerId: String,
    stripeSubId: String,
    currentPeriodEnd: Date
  },
  credits: { roses: { type: Number, default: 0 }, boosts: { type: Number, default: 0 } },
  profileCompleteness: { type: Number, default: 0 },  // 0 à 1, recalculé auto
  expoPushToken: String,      // token expo-server-sdk (PAS FCM raw)
  notifPrefs: {
    NEW_LIKE: { type: Boolean, default: true },
    NEW_MATCH: { type: Boolean, default: true },
    NEW_MESSAGE: { type: Boolean, default: true },
    MATCH_EXPIRING: { type: Boolean, default: true }
  },
  isVerified: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }
}
// timestamps: true
// Index : { location: '2dsphere' }, { age: 1, gender: 1 }, { stripeCustomerId: 1 }
// Pre-save hook : recalculer profileCompleteness
// Méthode instance : comparePassword(plain) → boolean
// Méthode statique : computeCompleteness(user) → 0..1
```

### Like.js
```js
{
  fromUserId: { type: ObjectId, ref: 'User', required: true },
  toUserId:   { type: ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['photo', 'prompt', 'general'] },
  targetId:   String,   // publicId photo ou index prompt
  comment:    { type: String, maxlength: 150 },
  seen:       { type: Boolean, default: false }
}
// timestamps: true
// Index unique composé : { fromUserId: 1, toUserId: 1 }
```

### Match.js
```js
{
  users:        [{ type: ObjectId, ref: 'User' }],  // exactement 2
  firstMessage: String,     // commentaire du like initial
  lastMessage:  String,
  lastActivity: { type: Date, default: Date.now },
  isActive:     { type: Boolean, default: true }
}
// timestamps: true
// Index : { users: 1 }, { lastActivity: -1 }
```

### Message.js
```js
{
  matchId:  { type: ObjectId, ref: 'Match', required: true },
  senderId: { type: ObjectId, ref: 'User', required: true },
  content:  { type: String, required: true },
  type:     { type: String, enum: ['text', 'gif', 'audio'], default: 'text' },
  isRead:   { type: Boolean, default: false }
}
// timestamps: true
// Index : { matchId: 1, createdAt: -1 }
```

### Prompt.js
```js
{
  question: { type: String, required: true },
  category: { type: String, enum: ['fun', 'deep', 'lifestyle'] },
  isActive: { type: Boolean, default: true }
}
```

## Auth — comportement
- `POST /api/auth/register` → bcrypt rounds 12 → accessToken (15min) + refreshToken (7j en httpOnly cookie)
- `POST /api/auth/login` → même retour
- `POST /api/auth/refresh` → lire cookie refreshToken → vérifier → émettre nouvel accessToken
- `POST /api/auth/logout` → clearer le cookie
- `authMiddleware` → extraire Bearer header → vérifier JWT → `req.user = await User.findById(id).select('-passwordHash')`
- Erreur token invalide → `{ success: false, error: 'AUTH_REQUIRED' }` 401

## Discover — logique feed
```js
// GET /api/discover/feed — pipeline $aggregate MongoDB
[
  { $geoNear: { near: user.location, distanceField: 'distance', maxDistance: prefMeters, spherical: true } },
  { $match: { _id: { $nin: excludedIds }, gender: { $in: genderPref }, age: { $gte: ageMin, $lte: ageMax }, 'photos.0': { $exists: true } } },
  { $addFields: { score: { $add: [ distanceScore*0.9, activityScore*0.7, completenessScore*0.6, popularityScore*0.5 ] } } },
  { $sort: { score: -1 } },
  { $limit: 10 },
  { $project: { name:1, age:1, photos:1, prompts:1, job:1, education:1, distance:1 } }
]
// Pagination cursor-based, pas skip/limit classique
// excludedIds = likes + passes des 30 derniers jours + bloqués + soi-même
```

## Like — logique match mutuel
```
POST /api/discover/like { toUserId, targetType, targetId?, comment? }
1. Vérifier checkLikeLimit (8/jour pour free)
2. Créer Like
3. Chercher like mutuel (Like.findOne({ fromUserId: toUserId, toUserId: req.user._id }))
4. Si mutuel → créer Match → émettre 'new_match' via Socket.io aux deux users
5. Retourner { isMatch, matchId? }
```

## Paiement Stripe — points critiques
- Route `/api/payment/webhook` → OBLIGATOIRE `express.raw({ type: 'application/json' })` (pas json())
- Vérifier `stripe.webhooks.constructEvent` avant tout traitement
- Événements à gérer : `customer.subscription.created/updated` → update User.subscription, `customer.subscription.deleted` → reset plan 'free'

## Notifications Push — expo-server-sdk (PAS firebase-admin)
```js
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPush(userId, { title, body, data }) {
  const user = await User.findById(userId).select('expoPushToken notifPrefs');
  if (!user?.expoPushToken) return;
  if (!Expo.isExpoPushToken(user.expoPushToken)) return;
  if (user.notifPrefs?.[data.type] === false) return;
  await expo.sendPushNotificationsAsync([{
    to: user.expoPushToken,
    title, body, data,
    sound: 'default'
  }]);
}
```
- Stocker `expoPushToken` (string Expo) dans User — reçu via `PUT /api/profile/expo-push-token`

## Socket.io — events
- Connexion : `socket.join(userId)` après vérification JWT depuis `socket.handshake.auth.token`
- Serveur émet : `new_match`, `new_message`, `typing`, `message_read`, `match_expiring`
- Client émet : `join_match`, `send_message`, `typing`, `mark_read`

## Middlewares
- `checkPlan(requiredPlan)` : vérifier plan + status === 'active' + currentPeriodEnd > now
- `checkLikeLimit` : 8 likes/jour pour 'free', bypass pour 'plus' et 'x'
- Codes d'erreur standardisés : `AUTH_REQUIRED`, `PLAN_REQUIRED`, `DAILY_LIKE_LIMIT`, `PROFILE_INCOMPLETE`, `VALIDATION_ERROR`

## Variables d'environnement (.env)
```
PORT=5000
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PLUS=
STRIPE_PRICE_X=
CLIENT_URL=http://localhost:3000
```

## Ce qu'il ne faut PAS faire
- Ne pas utiliser `req.body` sans validation express-validator
- Ne pas faire de requêtes DB dans les middlewares (sauf authMiddleware)
- Ne pas exposer les stack traces en production
- Ne pas utiliser firebase-admin pour les push → expo-server-sdk uniquement
- Ne pas oublier `await` sur les opérations Mongoose
