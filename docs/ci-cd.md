### CI/CD Pipeline (GitHub Actions → Cloud Run)

This project ships with a GitHub Actions workflow at `.github/workflows/ci.yml` that implements continuous integration and deployment to Google Cloud Run.

#### Triggers

- On push to `main`:
  - Run CI (lint, tests, coverage)
  - Build, scan, and push Docker image to Artifact Registry
  - Deploy latest image to Cloud Run
- Manual: `rollback` job (workflow_dispatch) provides guided commands to roll back traffic to a previous revision.

#### Required GitHub Secrets

- `GCP_PROJECT_ID`: GCP project ID
- `GCP_REGION`: e.g., `us-central1`
- `AR_REPO_NAME`: Artifact Registry repo (e.g., `containers`)
- `CLOUDRUN_SERVICE_NAME`: Cloud Run service name
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: Workload Identity Provider resource
- `GCP_SERVICE_ACCOUNT`: Service account email for GitHub OIDC
- `CODECOV_TOKEN`: Codecov upload token (optional if org/repo is auto-detected)
- `SNYK_TOKEN`: Snyk token for vulnerability scanning

See `docs/setup-gcp.md` for how to provision these resources and configure OIDC.

#### High-level flow

1. Checkout repository and set up Node.js 22.
2. Install dependencies with `npm ci`.
3. Lint (`npm run lint`). If lint fails, a follow-up `lint:fix` step runs to simulate auto-fixes.
4. Run tests with coverage (`npm run test:coverage`) and upload to Codecov.
5. Authenticate to Google Cloud using OIDC (no long-lived keys).
6. Configure Docker to push to Artifact Registry.
7. Extract app version from `package.json` and define two tags: `<version>` and `latest`.
8. Build a Docker image with both tags.
9. Scan the image with Trivy (results uploaded as SARIF) and Snyk (also uploaded).
10. Push the image to Artifact Registry.
11. Deploy the `latest` tag to Cloud Run with health/port/env settings.
12. Shift traffic to latest revision and verify with a health check.

#### Key configuration (from workflow)

- Image name format:
  - `${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO_NAME}/hello-world-api`
  - Tags: `${version}` and `latest`
- Cloud Run deployment flags:
  - `--allow-unauthenticated`
  - `--port=3000`
  - `--liveness-probe=httpGet.path=/health,timeoutSeconds=10,httpGet.port=3000`
  - `--cpu=1 --memory=512Mi --min-instances=1 --max-instances=3`
  - `--set-env-vars=NODE_ENV=production`

#### Local verification before pushing

```
npm ci
npm test
npm run lint
docker build -t hello-world-api .
docker run -p 3000:3000 hello-world-api
curl http://localhost:3000/health
```

#### Manual Rollback Instructions

The `rollback` job lists recent revisions and prints commands to route 100% traffic to a chosen revision. You can also run locally:

```
# List available revisions
gcloud run revisions list --service=hello-world-api --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic hello-world-api \
  --to-revisions=REVISION-NAME=100 \
  --region=${REGION}

# Or rollback to previous revision
PREVIOUS_REVISION=$(gcloud run revisions list --service=hello-world-api --region=us-central1 --format="value(metadata.name)" --limit=2 | tail -n 1)
gcloud run services update-traffic hello-world-api \
  --to-revisions=${PREVIOUS_REVISION}=100 \
  --region=${REGION}
```
