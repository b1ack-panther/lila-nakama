# Deployment Guide (Google Cloud)

This guide covers deploying the Nakama server on **Google Cloud Run** and using **Cloud SQL (Postgres)**.

1. Create a Google Cloud project and enable Cloud Run & Cloud SQL APIs.

2. Create a Cloud SQL Postgres instance. Note the instance connection name: `PROJECT:REGION:INSTANCE`.

3. Build and push Nakama Docker image:
```bash
docker build -t gcr.io/PROJECT_ID/lila-nakama ./backend
docker push gcr.io/PROJECT_ID/lila-nakama
```

4. Deploy to Cloud Run and connect Cloud SQL:
```bash
gcloud run deploy lila-nakama \
  --image gcr.io/PROJECT_ID/lila-nakama \
  --add-cloudsql-instances=PROJECT:REGION:INSTANCE \
  --set-env-vars DATABASE_ADDRESS=cloudsql-instance-connection-string,SOCKET_SERVER_KEY=defaultkey,SESSION_ENCRYPTION_KEY=yourkey \
  --platform managed --region us-central1
```

5. Configure firewall/VPC or use private IP for Cloud SQL per GCP docs.

6. Update frontend `services/nakama.js` to point to the deployed Nakama host (use HTTPS when required).

