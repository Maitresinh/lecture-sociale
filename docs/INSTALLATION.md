# Guide d'installation

## Prérequis

- Node.js 18+ et npm
- PostgreSQL 14+
- Git

## Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd lecture-sociale
```

### 2. Installation des dépendances

```bash
npm run install:all
```

### 3. Configuration de la base de données

1. Créer une base de données PostgreSQL :
```sql
CREATE DATABASE lecture_sociale;
```

2. Copier le fichier d'environnement :
```bash
cd backend
cp .env.example .env
```

3. Modifier les variables d'environnement dans `.env` :
```env
DATABASE_URL="postgresql://username:password@localhost:5432/lecture_sociale"
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 4. Migration de la base de données

```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Créer les dossiers d'upload

```bash
cd backend
mkdir -p uploads/books uploads/covers uploads/avatars logs
```

## Démarrage

### Mode développement

```bash
# Démarrer tout (frontend + backend)
npm run dev

# Ou séparément
npm run dev:frontend  # Port 3000
npm run dev:backend   # Port 3001
```

### Mode production

```bash
npm run build
npm start
```

## URLs

- Frontend : http://localhost:3000
- Backend API : http://localhost:3001/api
- Santé de l'API : http://localhost:3001/api/health

## Comptes de démonstration

- Admin : admin@example.com / password
- Utilisateur : user@example.com / password

## Structure du projet

```
lecture-sociale/
├── frontend/          # Application React
├── backend/           # API Node.js
├── shared/           # Types partagés
├── docs/             # Documentation
└── uploads/          # Fichiers uploadés
```