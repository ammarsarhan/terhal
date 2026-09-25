#!/bin/bash

set -e

BUCKET="terhal"
REGION="us-east-1"

echo "Initializing LocalStack..."

if awslocal s3api head-bucket --bucket "${BUCKET}" 2>/dev/null; then
    echo "S3 bucket '${BUCKET}' already exists."
else
    echo "Creating S3 bucket: ${BUCKET}"

    awslocal s3api create-bucket \
        --bucket "${BUCKET}" \
        --region "${REGION}"

    echo "S3 bucket '${BUCKET}' created."
fi

echo "LocalStack initialization complete."