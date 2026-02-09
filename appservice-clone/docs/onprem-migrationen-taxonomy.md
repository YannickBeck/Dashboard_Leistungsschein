# Taxonomie On-Prem Migrationen

## Ziel
Neue Angebotskategorie fuer klassische On-Prem-Serverrollen mit granularen, separat beauftragbaren Leistungsscheinen.

## Root-Struktur
`data/leistungsscheine/onprem-migrationen/<rolle>/<zielprodukt>/<phase>/`

## Rollenordner
- `smtp-relay`
- `identity-ad`
- `files`
- `print`
- `exchange`
- `sharepoint`
- `sql`
- `web-app`
- `avd`
- `sftp`
- `dns`
- `bastion`
- `waf`
- `loadbalancer`
- `apim`
- `monitor`
- `sentinel`
- `backup`
- `asr`
- `firewall-vpn`
- `patching`
- `intune`
- `keyvault`
- `messaging`
- `teams-phone`

## Phasen (standardisiert)
- `01_assessment`
- `02_design`
- `03_build`
- `04_migration`
- `05_cutover`
- `06_testing`
- `07_handover`
- `08_ops`
- `09_optimization`
- `10_change_enablement`

## ID-Konvention
Format:
`LS-OPM-<ROLLE>-<ZIEL>-<PHASE>-<NNN>`

Beispiel:
`LS-OPM-FILES-AZFILES-MIGRATION-001`

Regeln:
- `<ROLLE>`, `<ZIEL>`, `<PHASE>` in Grossbuchstaben, nur `A-Z0-9`.
- `<NNN>` dreistellig, pro Rolle/Ziel/Phase aufsteigend.
- Eine ID ist global eindeutig.
- Dateiname enthaelt die ID:
  `<ID>__<slug>.json`

## Inhaltliche Regel
Ein Leistungsschein bildet genau **ein bestellbares Outcome** ab. Wenn mehrere Outcomes enthalten sind, wird gesplittet.
