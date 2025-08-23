# Documentation API

## Base URL
```
http://localhost:3001/api
```

## Authentification

L'API utilise l'authentification JWT. Incluez le token dans l'header :
```
Authorization: Bearer <token>
```

## Endpoints

### Authentification

#### POST /auth/register
Inscription d'un nouvel utilisateur.

**Body :**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123"
}
```

#### POST /auth/login
Connexion utilisateur.

**Body :**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /auth/me
Informations de l'utilisateur connecté.

### Utilisateurs

#### GET /users/profile
Profil de l'utilisateur connecté.

#### PUT /users/profile
Mettre à jour le profil (avec upload d'avatar).

#### PUT /users/password
Changer le mot de passe.

#### GET /users/stats
Statistiques de l'utilisateur.

### Livres

#### GET /books
Liste des livres (paginée).

**Query params :**
- `page` : numéro de page (défaut: 1)
- `limit` : éléments par page (défaut: 20)
- `search` : recherche par titre/auteur

#### GET /books/:id
Détails d'un livre.

#### POST /books
Ajouter un livre (Admin/Author/Translator uniquement).
Multipart avec champs `epub` et `cover` (optionnel).

#### GET /books/:id/epub
Télécharger le fichier EPUB.

### Lectures partagées

#### GET /shared-readings/public
Lectures publiques (paginées).

**Query params :**
- `page`, `limit`, `search`

#### GET /shared-readings/my
Lectures de l'utilisateur connecté.

#### GET /shared-readings/:id
Détails d'une lecture partagée.

#### POST /shared-readings
Créer une nouvelle lecture partagée.

**Body :**
```json
{
  "title": "Titre de la lecture",
  "description": "Description optionnelle",
  "bookId": "book-id",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "isPublic": true
}
```

#### POST /shared-readings/:id/join
Rejoindre une lecture partagée.

#### PUT /shared-readings/:id/progress
Mettre à jour la progression de lecture.

**Body :**
```json
{
  "progress": 0.75,
  "cfi": "epubcfi(...)"
}
```

### Annotations

#### GET /annotations/shared-reading/:sharedReadingId
Annotations d'une lecture partagée.

#### POST /annotations
Créer une annotation.

**Body :**
```json
{
  "sharedReadingId": "reading-id",
  "content": "Mon commentaire",
  "cfi": "epubcfi(...)",
  "selectedText": "Texte sélectionné",
  "page": 42,
  "isPublic": true
}
```

#### PUT /annotations/:id
Mettre à jour une annotation.

#### DELETE /annotations/:id
Supprimer une annotation.

#### POST /annotations/:id/cite
Créer une citation à partir d'une annotation.

### Administration

#### GET /admin/dashboard
Tableau de bord administrateur.

#### GET /admin/stats
Statistiques d'utilisation.

#### GET /admin/shared-readings
Lectures avec statistiques détaillées.

## Codes de réponse

- `200` : Succès
- `201` : Créé
- `400` : Requête invalide
- `401` : Non authentifié
- `403` : Non autorisé
- `404` : Non trouvé
- `500` : Erreur serveur

## Format des réponses

### Succès
```json
{
  "success": true,
  "data": { ... }
}
```

### Erreur
```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

### Pagination
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```