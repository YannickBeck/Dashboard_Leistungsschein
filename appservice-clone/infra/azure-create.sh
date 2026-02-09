#!/usr/bin/env bash
set -euo pipefail

# Required
AZ_WEBAPP_NAME="${AZ_WEBAPP_NAME:-}"
if [[ -z "${AZ_WEBAPP_NAME}" ]]; then
  echo "ERROR: AZ_WEBAPP_NAME is required."
  echo "Example: export AZ_WEBAPP_NAME=my-leistungsschein-app"
  exit 1
fi

# Optional inputs
AZ_RG="${AZ_RG:-rg-leistungsschein}"
AZ_LOCATION="${AZ_LOCATION:-westeurope}"
AZ_APP_SERVICE_PLAN="${AZ_APP_SERVICE_PLAN:-asp-leistungsschein-linux}"
AZ_PLAN_SKU="${AZ_PLAN_SKU:-B1}"
AZ_RUNTIME="${AZ_RUNTIME:-NODE:20-lts}"
AZ_CREATE_STAGING_SLOT="${AZ_CREATE_STAGING_SLOT:-false}"
AZ_SLOT_NAME="${AZ_SLOT_NAME:-staging}"

echo "Creating resource group: ${AZ_RG} (${AZ_LOCATION})"
az group create \
  --name "${AZ_RG}" \
  --location "${AZ_LOCATION}" \
  --output table

echo "Creating Linux App Service plan: ${AZ_APP_SERVICE_PLAN}"
az appservice plan create \
  --resource-group "${AZ_RG}" \
  --name "${AZ_APP_SERVICE_PLAN}" \
  --is-linux \
  --sku "${AZ_PLAN_SKU}" \
  --output table

echo "Creating web app: ${AZ_WEBAPP_NAME} runtime=${AZ_RUNTIME}"
az webapp create \
  --resource-group "${AZ_RG}" \
  --plan "${AZ_APP_SERVICE_PLAN}" \
  --name "${AZ_WEBAPP_NAME}" \
  --runtime "${AZ_RUNTIME}" \
  --output table

echo "Setting required app settings"
az webapp config appsettings set \
  --resource-group "${AZ_RG}" \
  --name "${AZ_WEBAPP_NAME}" \
  --settings \
    NODE_ENV=production \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
  --output table

echo "Configuring health check path"
az webapp config set \
  --resource-group "${AZ_RG}" \
  --name "${AZ_WEBAPP_NAME}" \
  --health-check-path "/healthz" \
  --output table

if [[ "${AZ_CREATE_STAGING_SLOT}" == "true" ]]; then
  echo "Creating deployment slot: ${AZ_SLOT_NAME}"
  az webapp deployment slot create \
    --resource-group "${AZ_RG}" \
    --name "${AZ_WEBAPP_NAME}" \
    --slot "${AZ_SLOT_NAME}" \
    --output table

  echo "Configuring slot app settings"
  az webapp config appsettings set \
    --resource-group "${AZ_RG}" \
    --name "${AZ_WEBAPP_NAME}" \
    --slot "${AZ_SLOT_NAME}" \
    --settings \
      NODE_ENV=staging \
      SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    --output table

  az webapp config set \
    --resource-group "${AZ_RG}" \
    --name "${AZ_WEBAPP_NAME}" \
    --slot "${AZ_SLOT_NAME}" \
    --health-check-path "/healthz" \
    --output table
fi

APP_URL="https://${AZ_WEBAPP_NAME}.azurewebsites.net"
echo "Done. App URL: ${APP_URL}"

