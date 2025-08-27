# Setup GCP resources

## My decision to choose gcloud cli over terraform

For this challenge, I decided to use the gcloud CLI as my primary tool to manage Google Cloud resources (creating service accounts, deploying to Cloud Run, setting permissions,), instead of using Terraform because:

- Commands like `gcloud run deploy` are imperative and straightforward, they clearly state the action being performed, making the setup transparent to reviewers. For this challenge, the infrastructure requirements were relatively small and straightforward (a service account for github actions, Cloud Run service, Artifact Registry). This helps highlight how each resource is configured step by step, which can sometimes be hidden behind Terraform abstractions
- The challenge is time-boxed and primarily aimed at showcasing my ability to set up CI/CD, deploy applications, and integrate with GCP services, so uising cli allowed me to quikcly provision the requried resources and focus more on building ci/cd workflow
- While I chose gcloud here for speed and clarity, I recognize that in a real-world production environment, Terraform would be the better choice for IaC. It provides version control for infrastructure, consistent deployments across environments, and better collaboration

## Setup Instructions

### Prerequisites

- Google Cloud account with billing enabled
- GitHub repository
- gcloud CLI installed or using cloud shell

### 1. Google Cloud Setup

```bash
# Set variables (replace with your values)
export PROJECT_ID="your-project-id"
export REGION="your desired region"
export SERVICE_NAME="hello-world-api"
export REPO_NAME="hello-world-repo"
export SERVICE_ACCOUNT_NAME="github-actions-sa"
export WIF_POOL_NAME="github-actions-pool"
export WIF_PROVIDER_NAME="github-actions-provider"
export GITHUB_REPO="your-username/your-repo-name"

# Enable APIs
gcloud services enable run.googleapis.com \
        artifactregistry.googleapis.com \
        logging.googleapis.com \
        monitoring.googleapis.com \
        --project=$PROJECT_ID

# Create Artifact Registry
gcloud artifacts repositories create $REPO_NAME \
        --repository-format=docker \
        --location=$REGION \
        --project=$PROJECT_ID

# Create Service Account for Github Actions Runner
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="GitHub Actions SA" \
        --project=$PROJECT_ID

# Set IAM roles (least privilege)
export SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/run.admin" # Role for Cloud Run Deployment

gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/artifactregistry.writer" # Allow push image to AR

gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/logging.logWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/iam.serviceAccountUser" # Github Actions Auth

# Setup Workload Identity Federation
gcloud iam workload-identity-pools create $WIF_POOL_NAME \
        --location="global" \
        --project=$PROJECT_ID

gcloud iam workload-identity-pools providers create-oidc $WIF_PROVIDER_NAME \
        --workload-identity-pool=$WIF_POOL_NAME \
        --location="global" \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
        --attribute-condition="assertion.repository=='$GITHUB_REPO'" \
        --project=$PROJECT_ID

# Bind service account to WIF
export WIF_POOL_ID=$(gcloud iam workload-identity-pools describe $WIF_POOL_NAME \
        --location="global" \
        --project=$PROJECT_ID \
        --format="value(name)")
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
        --role="roles/iam.workloadIdentityUser" \
        --member="principalSet://iam.googleapis.com/$WIF_POOL_ID/attribute.repository/$GITHUB_REPO" \
        --project=$PROJECT_ID
```

### 2. GitHub Secrets Setup

Add these secrets to your GitHub repository:

- `GCP_PROJECT_ID`: Your GCP project ID
- `GCP_REGION`: Deployment region (us-central1)
- `CLOURUN_SERVICE_NAME`: Cloud Run service name
- `AR_REPO_NAME`: Artifact Registry repository name
- `GCP_SERVICE_ACCOUNT`: Service account email
- `GCP_GCP_WORKLOAD_IDENTITY_PROVIDER`: Workload Identity Federation provider ID

### 3. Deploy

Push to `main` branch to trigger automatic deployment.

## 🔐 Security Implementation

### Docker Security

- **Non-root user**: Application runs as non-root user (UID 2003)
- **Multi-stage build**: Minimizes attack surface and image size
- **Vulnerability scanning**: Trivy scans for CVEs in CI pipeline

### Google Cloud Security

- **Workload Identity Federation**: Keyless authentication (no service account keys)
- **Least privilege IAM**: Minimal required permissions only

## 📊 IAM Roles & Permissions

| Role                      | Purpose                   | Justification                     |
| ------------------------- | ------------------------- | --------------------------------- |
| `run.admin`               | Deploy Cloud Run services | Required for service updates      |
| `artifactregistry.writer` | Push Docker images        | Required for image storage        |
| `logging.logWriter`       | Write application logs    | Required for observability        |
| `iam.serviceAccountUser`  | Act as service account    | Required for Cloud Run deployment |

## 💰 Cost Estimate (Monthly)

| Service           | Free Tier Limit | Usage         | Cost   |
| ----------------- | --------------- | ------------- | ------ |
| Cloud Run         | 2M requests     | ~10K requests | $0     |
| Artifact Registry | 0.5GB storage   | ~100MB        | $0     |
| Cloud Logging     | 50GB            | ~1GB          | $0     |
| **Total**         |                 |               | **$0** |

_Estimated for development/demo usage within free tier limits_
