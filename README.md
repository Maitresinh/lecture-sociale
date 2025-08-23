# 📚 Application de Lecture Sociale

> Une plateforme collaborative pour la lecture partagée d'EPUBs avec annotations et partage social
> génrée avec code claude. Non encore testée

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

## ✨ Fonctionnalités principales

### 📖 Lecture collaborative
- **Interface de lecture fluide** avec navigation intuitive
- **Système d'annotations** en temps partagé
- **Lectures à durée limitée** avec compte à rebours
- **Gestion des participants** avec différents statuts

### 🎨 Expérience utilisateur
- **Thèmes personnalisables** (clair, sombre, sépia)
- **Police et taille ajustables**
- **Interface responsive** mobile et desktop
- **Partage social** sur Twitter, Facebook, Instagram

### 👨‍💼 Administration
- **Tableau de bord** avec statistiques détaillées
- **Gestion des utilisateurs** et des statuts
- **Upload de livres EPUB** avec couvertures
- **Analytics des commentaires** par temps/personne/date

### 🌍 Accessibilité publique
- **Page publique** présentant toutes les lectures
- **Recherche et filtres** avancés
- **Descriptions détaillées** de chaque lecture partagée

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd lecture-sociale

# Installer les dépendances
npm run install:all

# Configuration
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres de base de données

# Base de données
npm run db:generate
npm run db:migrate  
npm run db:seed

# Démarrer l'application
cd ..
npm run dev
```

🎉 L'application sera disponible sur :
- **Frontend** : http://localhost:3000
- **API** : http://localhost:3001/api

## 🏗️ Architecture

```
lecture-sociale/
├── frontend/           # Application React + TypeScript
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   ├── hooks/         # Hooks React personnalisés
│   │   └── lib/          # Utilitaires
├── backend/            # API Node.js + Express
│   ├── src/
│   │   ├── routes/       # Routes API
│   │   ├── controllers/   # Logique métier
│   │   ├── middleware/    # Middlewares Express
│   │   └── utils/        # Utilitaires backend
├── shared/             # Types TypeScript partagés
└── docs/              # Documentation
```

### Stack technologique

**Frontend**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Radix UI
- React Router
- ePub.js (lecteur EPUB)
- Axios

**Backend**
- Node.js + Express
- TypeScript
- Prisma ORM + PostgreSQL
- JWT authentification
- Multer (upload fichiers)
- Winston (logging)

## 📊 Fonctionnalités détaillées

### Statuts utilisateurs
- **👤 Utilisateur** : Peut rejoindre des lectures publiques
- **✍️ Auteur** : Peut créer des lectures partagées
- **🌍 Traducteur** : Peut créer des lectures et gérer les traductions
- **👥 Invité** : Accès limité via codes d'invitation
- **🔧 Admin** : Accès total à l'administration

### Gestion des lectures
- **Durée configurable** avec compte à rebours visible
- **Invitations par code** pour les lectures privées
- **Suivi de progression** individuel et global
- **Statistics détaillées** des interactions

### Système d'annotations
- **Sélection de texte** intuitive
- **Commentaires personnalisés** 
- **Visibilité publique/privée**
- **Modération** par les administrateurs
- **Export des données** pour analyse

## 🔧 Configuration

### Variables d'environnement (backend)

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/lecture_sociale"

# JWT
JWT_SECRET="votre-clé-secrète-très-longue"
JWT_EXPIRES_IN="7d"

# Serveur
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL="http://localhost:3000"
```

### Structure de la base de données

Le schéma Prisma définit :
- **Users** : Gestion des utilisateurs et statuts
- **Books** : Métadonnées des livres EPUB
- **SharedReadings** : Lectures collaboratives
- **Annotations** : Commentaires et sélections
- **Citations** : Partages sur réseaux sociaux

## 📱 API REST

L'API suit les conventions REST avec authentification JWT.

### Endpoints principaux
- `POST /api/auth/login` - Connexion
- `GET /api/shared-readings/public` - Lectures publiques
- `POST /api/annotations` - Créer une annotation
- `GET /api/admin/dashboard` - Tableau de bord admin

📖 [Documentation API complète](docs/API.md)

## 🎯 Cas d'usage

### Clubs de lecture
- Lectures synchronisées avec discussions
- Partage de réflexions et analyses
- Suivi de progression collective

### Éducation  
- Lectures de classe avec annotations
- Analyse collaborative de textes
- Engagement étudiant renforcé

### Éditeurs et auteurs
- Promotion de nouveaux livres
- Interaction directe avec les lecteurs
- Feedback en temps réel sur les œuvres

## 🛠️ Développement

### Scripts disponibles

```bash
# Développement
npm run dev              # Frontend + Backend
npm run dev:frontend     # Frontend seulement  
npm run dev:backend      # Backend seulement

# Production
npm run build           # Build complet
npm run start           # Démarrer en production

# Base de données
npm run db:migrate      # Migrations
npm run db:seed         # Données d'exemple
npm run db:generate     # Générer client Prisma
```

### Tests et qualité

```bash
# Linting
npm run lint:frontend
npm run lint:backend

# Tests (à implémenter)
npm run test
npm run test:e2e
```

## 🚀 Déploiement

### Docker (recommandé)

```bash
# Build des images
docker-compose build

# Démarrage des services
docker-compose up -d

# Migrations
docker-compose exec backend npm run db:migrate
```

### Déploiement manuel

1. **Serveur** : VPS avec Node.js et PostgreSQL
2. **Reverse proxy** : Nginx pour servir les fichiers statiques
3. **SSL** : Certificats Let's Encrypt
4. **Monitoring** : PM2 pour la gestion des processus

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork du projet
2. Créer une branche feature (`git checkout -b feature/ma-fonctionnalite`)
3. Commit des changes (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Push sur la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

### Guidelines
- Code en TypeScript avec types stricts
- Tests unitaires pour les nouvelles fonctionnalités
- Documentation des APIs
- Respect des conventions de nommage

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [ePub.js](https://github.com/futurepress/epub.js/) pour le rendu EPUB
- [Tailwind CSS](https://tailwindcss.com/) pour le système de design
- [Prisma](https://prisma.io/) pour l'ORM moderne
- [Radix UI](https://radix-ui.com/) pour les composants accessibles

---

**Fait avec ❤️ pour la communauté des lecteurs**

🐛 Bugs : [Issues GitHub](https://github.com/votre-username/lecture-sociale/issues)
