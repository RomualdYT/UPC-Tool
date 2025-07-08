# UPC Legal Tool

UPC Legal provides a complete workflow to collect Unified Patent Court (UPC) decisions and orders and expose them through a searchable web interface.

The project is split into a **FastAPI** backend and a **React** frontend.  Decisions can be scraped from the official UPC website and stored in MongoDB for offline search and analysis.

## Repository structure

```
backend/         FastAPI application and scraper
frontend/        React user interface (TailwindCSS)
backend_test.py  Basic integration tests for the API
```

## Running the backend

1. Install Python requirements:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Ensure MongoDB is available and set `MONGO_URL` if it is not on `mongodb://localhost:27017/`.
3. Start the API:
   ```bash
   uvicorn backend.server:app --host 0.0.0.0 --port 8001
   ```

When the server starts for the first time it attempts to synchronise a small number of decisions from the UPC website. Sample data will be used if the sync fails.

### Important environment variables

- `MONGO_URL` – connection string to the MongoDB instance (default `mongodb://localhost:27017/`).

## Running the frontend

The frontend is a standard React application.  It expects the backend to be running on `http://localhost:8001` or the value of `REACT_APP_BACKEND_URL`.

```
cd frontend
npm install
npm start          # development mode
npm run build      # create production build
```

## API overview

The main API endpoints exposed by the backend are:

- `GET /api/health` – simple health check.
- `GET /api/cases` – list cases with optional filtering and pagination.
- `GET /api/cases/{id}` – retrieve a specific case.
- `GET /api/cases/count` – count cases matching filters.
- `GET /api/filters` – retrieve available filter values.
- `POST /api/sync/upc` – trigger UPC website scraping.
- `GET /api/sync/status` – database and sync status information.
- `GET /api/stats` – basic statistics about stored cases.

## Tests

`backend_test.py` contains integration tests for the API.  The backend must be running and connected to MongoDB for the tests to succeed:

```
python backend_test.py
```

## Building

The repository already contains a compiled frontend build in `frontend/build`.  This can be served by any static file server or placed behind a proxy together with the backend.

## License

This repository is provided for demonstration purposes.  No license was supplied with the original code.
