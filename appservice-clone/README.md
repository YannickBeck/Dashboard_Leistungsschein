# Leistungsschein Dashboard (App Service Ready)

Node.js/Express App fuer Angebotskonfiguration inklusive DOCX-Generierung.

## Voraussetzungen

- Node.js LTS (empfohlen: 20.x oder 22.x, `engines: >=20 <=24`)
- npm
- Optional fuer Azure-Provisionierung: Azure CLI (`az`)

## Lokaler Start

```bash
npm ci
npm start
```

Aufruf:

- Dashboard: `http://localhost:3000`
- Health: `http://localhost:3000/healthz`

## Konfiguration

Es sind keine Secrets fuer den lokalen Betrieb erforderlich.

Optional:

- `PORT` (Default `3000`)
- `NODE_ENV` (Default `development` lokal, in Azure `production`)

Beispiel: `.env.example`.

## Repo-Hinweis zu Daten

`data/leistungsscheine/_generated` wird bewusst mit versioniert (Option A), damit die App ohne Generierungsschritt sofort lauffaehig ist und `/api/modules` in jeder Umgebung direkt funktioniert.

## Azure App Service Deployment (GitHub Actions)

Dieses Repo nutzt `.github/workflows/deploy-appservice.yml`.

Trigger:

- Push auf `main`
- `workflow_dispatch`

### Benoetigte Repo Variables

- `AZURE_WEBAPP_NAME` (Pflicht)
- `AZURE_WEBAPP_SLOT_NAME` (optional, z. B. `staging`)

### Authentisierung Variante B (aktiv, empfohlen): OIDC

Repo Secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Workflow nutzt `azure/login@v2` mit `id-token: write`.

### Authentisierung Variante A (alternativ): Publish Profile

Im Workflow ist ein kommentierter Schritt vorbereitet.

Zusatz-Secret:

- `AZURE_WEBAPP_PUBLISH_PROFILE`

Publish Profile beziehen:

1. Azure Portal -> App Service -> Overview
2. `Get publish profile` herunterladen
3. Inhalt als Repo Secret `AZURE_WEBAPP_PUBLISH_PROFILE` speichern

## Wichtige App Settings in Azure

Dieses Setup setzt auf Oryx Build Automation bei Deploy:

- `SCM_DO_BUILD_DURING_DEPLOYMENT=true`
- `NODE_ENV=production`
- Health Check Path: `/healthz`

Hinweis:
Wenn `SCM_DO_BUILD_DURING_DEPLOYMENT` nicht gesetzt ist, muss ein bereits lauffaehiges Paket (inkl. `node_modules`) deployt werden.

## Einfache Azure-Einrichtung per Script

Siehe: `infra/azure-create.sh`

Beispiel:

```bash
export AZ_WEBAPP_NAME="<dein-app-name>"
export AZ_RG="rg-leistungsschein-prod"
export AZ_LOCATION="westeurope"
bash infra/azure-create.sh
```

Optional mit Slot:

```bash
export AZ_CREATE_STAGING_SLOT=true
export AZ_SLOT_NAME=staging
bash infra/azure-create.sh
```

## Smoke Checks nach Deploy

1. `GET /healthz` -> `200`
2. `GET /api/modules` -> JSON Array
3. UI Dashboard laedt
4. Moduldetails inkl. `mehrwert` sichtbar
5. `POST /api/generate` liefert DOCX Download

## Start Command (App Service)

Standard: `npm start`

