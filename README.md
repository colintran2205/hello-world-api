## Hello World API

A minimal Express-based HTTP API with health and root endpoints, CI/CD via GitHub Actions, containerized with Docker, and deployable to Google Cloud Run.

### Endpoints

- `GET /`: returns `{ "status": "ok" }`
- `GET /health`: returns `{ "status": "ok" }`

### Getting started

1. Install Node.js 22.x
2. Install dependencies:

```
npm ci
```

3. Run locally:

```
npm start
```

The server listens on port `3000` by default.

### Tests

Run unit tests and coverage:

```
npm test
npm run test:coverage
```

### Linting

```
npm run lint
npm run lint:fix
```

### Docker

Build and run the container locally:

```
docker build -t hello-world-api .
docker run -p 3000:3000 hello-world-api
```

### CI/CD and Deployment

This repo includes a GitHub Actions workflow that lint/tests, builds a Docker image, scans it, pushes it to Google Artifact Registry, and deploys to Cloud Run.

- CI/CD details: see `docs/ci-cd.md`
- GCP setup prerequisites (service account, Artifact Registry, Cloud Run, secrets): see `docs/setup-gcp.md`

### Project structure

- `app.js`: Express app definition and routes
- `server.js`: server bootstrap
- `app.test.js`: tests using Jest and Supertest
- `Dockerfile`: container image definition
- `.github/workflows/ci.yml`: CI/CD pipeline
- `docs/`: documentation

### Scripts

- `npm start`: run the API
- `npm test`: run tests
- `npm run test:coverage`: run tests with coverage
- `npm run lint`: lint
- `npm run lint:fix`: auto-fix lint issues
