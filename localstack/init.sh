#!/bin/bash

set -e

BUCKET="terhal"
REGION="us-east-1"

echo "Initializing LocalStack..."

echo "Creating S3 bucket: ${BUCKET}"

awslocal s3api create-bucket \
  --bucket "${BUCKET}" \
  --region "${REGION}" 2>/dev/null || true

echo "S3 bucket '${BUCKET}' is ready."

echo "LocalStack initialization complete."