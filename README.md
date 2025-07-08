# Outil juridique UPC

Ce projet fournit une solution complète pour collecter les décisions et ordonnances de la **Cour unifiée des brevets (UPC)** et les consulter via une interface web simple. Il se compose d'un **backend FastAPI** et d'un **frontend React**.

## Structure du dépôt
```
backend/         application FastAPI et module de scraping
frontend/        interface React (avec TailwindCSS)
backend_test.py  tests d'intégration de l'API
```

## Prérequis
- **Python 3.12** ou plus récent
- **Node.js 18** ou plus récent
- **MongoDB** (par défaut sur `mongodb://localhost:27017/`)

## Installation et lancement du backend
1. Installez les dépendances Python :
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Vérifiez que MongoDB est accessible. Modifiez la variable d'environnement `MONGO_URL` si besoin.
3. Démarrez l'API :
   ```bash
   uvicorn backend.server:app --host 0.0.0.0 --port 8001
   ```
Au premier lancement, le serveur tente de récupérer quelques décisions depuis le site de l'UPC. Si la récupération échoue, des données exemples sont chargées.

### Variables d'environnement importantes
- `MONGO_URL` – chaîne de connexion à MongoDB (`mongodb://localhost:27017/` par défaut).

## Installation et lancement du frontend
Le frontend attend que le backend fonctionne sur `http://localhost:8001` (ou la valeur de `REACT_APP_BACKEND_URL`).

```bash
cd frontend
npm install
npm start          # mode développement
npm run build      # production
```

## Tutoriel rapide pour Windows
1. Installez [Python](https://www.python.org/downloads/windows/) et [Node.js](https://nodejs.org/). Durant l'installation, cochez l'option pour ajouter Python et Node à votre `PATH`.
2. Installez [MongoDB Community Edition](https://www.mongodb.com/try/download/community) et lancez le service `mongod`.
3. Ouvrez **PowerShell** et installez les dépendances, puis lancez le backend :
   ```bash
   pip install -r backend/requirements.txt
   python -m uvicorn backend.server:app --host 0.0.0.0 --port 8001
   ```
   Dans un autre terminal, démarrez le frontend depuis le dossier `frontend` :
   ```bash
   npm start
   ```
4. Ouvrez un navigateur à l'adresse `http://localhost:3000` pour accéder au site.

## Tutoriel rapide pour macOS
1. Installez [Homebrew](https://brew.sh/) si nécessaire.
2. Ouvrez le Terminal et installez Python, Node.js puis MongoDB :
   ```bash
   brew install python node
   brew tap mongodb/brew
   brew install mongodb-community   # or mongodb-community@<version>
   brew services start mongodb-community
   ```
3. Placez-vous dans le dossier du projet `UPC-Tool` puis installez le backend et lancez-le :
   ```bash
   cd /chemin/vers/UPC-Tool
   pip3 install -r backend/requirements.txt
   python3 -m uvicorn backend.server:app --host 0.0.0.0 --port 8001
   ```
   Démarrez le frontend dans un autre terminal :
   ```bash
   npm start
   ```
4. Accédez au site via `http://localhost:3000`.

## Fonctionnement de l'outil
- **Backend FastAPI** : expose des points d'API REST permettant de rechercher, filtrer et consulter les décisions stockées dans MongoDB.
- **Scraper UPC** (`backend/upc_scraper.py`) : récupère les décisions depuis le site officiel de l'UPC, analyse le contenu des pages et enregistre les données structurées dans la base.
- **Frontend React** : affiche une interface de recherche (filtres, liste de résultats, détails d'une décision) en communiquant avec l'API.

### Principales routes de l'API
- `GET /api/health` : test simple de disponibilité.
- `GET /api/cases` : liste paginée des décisions avec filtres.
- `GET /api/cases/{id}` : détail d'une décision.
- `GET /api/cases/count` : nombre total de décisions correspondant aux filtres.
- `GET /api/filters` : valeurs possibles pour les filtres (tribunaux, langues, etc.).
- `POST /api/sync/upc` : lance le scraping des décisions UPC.
- `GET /api/sync/status` : informations sur la base et l'état de synchronisation.
- `GET /api/stats` : statistiques de base sur les décisions enregistrées.

## Tests
`backend_test.py` contient des tests basés sur `unittest`. Le backend doit être démarré et connecté à MongoDB pour que les tests passent :
```bash
python backend_test.py
```

## Compilation du frontend
Une version compilée se trouve déjà dans `frontend/build`. Vous pouvez la servir via n'importe quel serveur de fichiers statiques ou derrière un proxy avec le backend.

## Licence
Ce dépôt est fourni à titre démonstratif. Aucune licence spécifique n'a été indiquée par les auteurs initiaux.
