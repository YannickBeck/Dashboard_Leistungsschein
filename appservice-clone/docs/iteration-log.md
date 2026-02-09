# Iteration Log

## Iteration 0 - Ist-Analyse & Gap-Check
- Geaendert:
  - `docs/gap-analysis.md` erstellt (Qualitaetsluecken, Metriken, Regeln).
  - `scripts/smokeCheck.js` erstellt fuer wiederholbaren Server/API-Smoke-Test.
  - `package.json` um Script `smoke` erweitert.
- Getestet:
  - `node scripts/smokeCheck.js`
- Ergebnis:
  - Server/API laufen (Health ok, Module werden geladen).
  - Gap ist eindeutig: Inhalte sind durchgaengig zu kurz/generisch und ohne neue Angebotsfelder.
- Naechste Iteration:
  - Versioniertes JSON-Schema + Validator mit Duplicate-ID, Dateinamen-Check und Strukturvalidierung.

## Iteration 1 - Schema, Migration, Validator
- Geaendert:
  - `data/schema/leistungsschein.schema.json` erstellt (versioniertes LS-Schema, Pflichtfelder inkl. Scope/RACI/Change-Control).
  - `scripts/validateLeistungsscheine.js` erstellt:
    - Schema-Validierung (Ajv)
    - Duplicate-ID Check
    - Dateiname-enthaelt-ID Check
    - Fehler-Exitcode.
  - `scripts/upgradeLeistungsscheineSchema.js` erstellt und ausgefuehrt (Bestandsmigration auf neues Feldset).
  - `lib/dataLoader.js` erweitert um neue Felder (`scope`, `effort_drivers`, `risks`, `mitigations`, `responsibilities`, `raci`, `change_control`, `notes`).
- Getestet:
  - `node scripts/upgradeLeistungsscheineSchema.js`
  - `node scripts/validateLeistungsscheine.js`
  - `node scripts/smokeCheck.js`
- Ergebnis:
  - 460 LS migriert.
  - Validator gruen (460/460).
  - API/Loader laufen weiterhin stabil.
- Naechste Iteration:
  - Inhaltliche Enrichment-Logik + Splits fuer zu breite LS + Enrichment-Report.

## Iteration 2 - Enrichment & Split bestehender LS
- Geaendert:
  - `scripts/enrichLeistungsscheine.js` erstellt und ausgefuehrt.
  - Alle bestehenden LS inhaltlich erweitert (konkrete Services/Deliverables/Abnahme/Out-of-scope/Scope/Treiber/Risiken).
  - Zu breite Bausteine granularisiert (Splits):
    - `LS-1008` (Decommission) -> 7 Teilbausteine
    - `LS-1015` (Monitoring) -> 5 Teilbausteine
  - `docs/enrichment-report.md` erzeugt.
- Getestet:
  - `node scripts/enrichLeistungsscheine.js`
  - `node scripts/validateLeistungsscheine.js`
  - `node scripts/smokeCheck.js`
  - `node tmp_generate_check.js` (temporaer) fuer DOCX-Generate-Ende-zu-Ende
- Ergebnis:
  - Bestand von 460 auf 472 LS erweitert.
  - Validator gruen (472/472).
  - Generate API liefert weiterhin DOCX erfolgreich.
- Naechste Iteration:
  - Azure-Indexer aktualisieren und den Relevanz-/Generator-Flow auf neues, nicht-generisches LS-Niveau heben.

## Iteration 3 - Azure-Produktindex (Scraping)
- Geaendert:
  - `scripts/indexAzureProducts.js` ueberarbeitet:
    - robuster Fetch mit Retry + User-Agent + Rate-Limit
    - Kategorie-Normalisierung auf Dienstleistungsdomaenen
    - optionales Detail-Enrichment von Produktseiten
- Getestet:
  - `node scripts/indexAzureProducts.js`
  - `node -e "..."` Kurzcheck auf Produkt-/Kategorieanzahl
- Ergebnis:
  - Index neu erzeugt: 197 Produkte, 16 Kategorien (`data/azure-products-index.de-de.json`).
- Naechste Iteration:
  - Relevanzselektion und massive, granularere LS-Generierung.

## Iteration 4 - Relevanz + Massengenerator
- Geaendert:
  - `scripts/selectRelevantAzureProducts.js` neu erstellt (heuristisches Scoring + Domain-Vorschlag + Rationale).
  - `scripts/generateLeistungsscheineFromAzureIndex.js` neu implementiert:
    - mehrstufige, granulare Phasen pro Produkt
    - neue Pflichtfelder (`scope`, `effort_drivers`, `risks`, `mitigations`, `raci`, `change_control`)
    - realistische Aufwandsschaetzungsranges (PT min/likely/max)
  - `package.json` Script `score:azure` auf neues Relevanzscript umgestellt.
- Getestet:
  - `node scripts/selectRelevantAzureProducts.js`
  - `node scripts/generateLeistungsscheineFromAzureIndex.js`
  - `node scripts/validateLeistungsscheine.js`
  - `node scripts/smokeCheck.js`
  - `node -e "..."` Loader-Performance-Check
- Ergebnis:
  - Relevante Produkte: 73/197.
  - Neu generierte LS unter `_generated`: 655.
  - Gesamtbestand: 697 LS, Validator gruen.
  - Loader-Read inkl. Taxonomie performant (`~231 ms`).
- Naechste Iteration:
  - UI/DOCX auf neue Detailfelder ausbauen und End-to-End regressionssicher pruefen.

## Iteration 5 - UI/DOCX Finalisierung
- Geaendert:
  - `public/app.js` Detail-Modal erweitert um:
    - Aufwand min/likely/max
    - Scope/Scope-Qty/Boundaries
    - Aufwandstreiber
    - Risiken und Massnahmen
    - Change-Control
  - `offerDocx.js` erweitert:
    - Aufwandsschaetzung & Kostenrahmen (unverbindlich) mit Annahmen/Treibern
    - je LS: Scope/Boundaries, Treiber, Risiken, Massnahmen, Mitwirkung, RACI, Change-Control
    - Disclaimer weiterhin ohne Festpreislogik
  - Testhilfen hinzugefuegt:
    - `scripts/generateCheck.js`
    - `scripts/uiModalCheck.js`
- Getestet:
  - `node scripts/validateLeistungsscheine.js`
  - `node scripts/smokeCheck.js`
  - `node scripts/generateCheck.js`
  - `node scripts/uiModalCheck.js`
- Ergebnis:
  - Alle Checks gruen.
  - Detail-Modal zeigt den aktiv gewaehhlten LS und neue Tiefenfelder korrekt.
  - DOCX-Export funktioniert mit erweitertem, schaetzungsbasiertem Inhalt.

## On-Prem Iteration 0 - Taxonomie & ID-Konvention
- Geaendert:
  - Neue Taxonomie dokumentiert in `docs/onprem-migrationen-taxonomy.md`.
  - Rollenordner unter `data/leistungsscheine/onprem-migrationen/` angelegt.
  - Schema-ID-Muster erweitert fuer `LS-OPM-...` Formate (`data/schema/leistungsschein.schema.json`).
- Getestet:
  - `node scripts/validateLeistungsscheine.js`
  - `node scripts/smokeCheck.js`
- Ergebnis:
  - Basis fuer On-Prem-Kategorie steht; bestehender Loader/Server unveraendert lauffaehig.
- Naechste Iteration:
  - Angebotskategorie + Presets fuer On-Prem Migrationen.

## On-Prem Iteration 1 - Angebotskategorie & Presets
- Geaendert:
  - Neuer Preset-Generator: `scripts/generateOnPremPresets.js`.
  - Kategorienindex erzeugt/erweitert: `data/offers/categories.json` (inkl. `onprem-migrationen`).
  - 17 Presets unter `data/offers/onprem-migrationen/` erzeugt.
  - `lib/dataLoader.js` erweitert:
    - Presets aus `defaultSelected` oder `module_ids`
    - Kategorie-Metadaten (`category`, `category_title`)
  - `public/app.js` angepasst:
    - Presets gruppiert nach Kategorie (Optgroup)
    - Presets kompatibel mit `defaultSelected`.
  - Integrationstest hinzugefuegt: `scripts/presetIntegrationCheck.js`.
- Getestet:
  - `node scripts/generateOnPremPresets.js`
  - `node scripts/presetIntegrationCheck.js`
  - `node scripts/generateCheck.js`
- Ergebnis:
  - On-Prem Presets sichtbar und fuer Generierung nutzbar.
- Naechste Iteration:
  - Granulare LS-Bibliothek fuer Files + DNS + SFTP (20-40 je Zielprodukt).

## On-Prem Iteration 2 - Massive LS (Files + DNS + SFTP)
- Geaendert:
  - Neuer Generator: `scripts/generateOnPremLeistungsscheine.js`.
  - Lauf mit Subset-Rollen:
    - `files` (Azure Files + SharePoint/OneDrive)
    - `dns` (Private Resolver)
    - `sftp` (Blob SFTP)
  - Ergebnis im Pfad:
    - `data/leistungsscheine/onprem-migrationen/<rolle>/<ziel>/<phase>/`
- Getestet:
  - `node scripts/generateOnPremLeistungsscheine.js --clean --roles=files,dns,sftp`
  - `node scripts/generateOnPremPresets.js`
  - `node scripts/validateLeistungsscheine.js`
  - `node scripts/smokeCheck.js`
  - `node scripts/presetIntegrationCheck.js`
- Ergebnis:
  - 120 neue LS (je Zielprodukt 30 LS) mit testbaren Abnahmekriterien und granularen Outcomes.
  - Gesamtbestand stieg auf 817 LS; Validator gruen.
- Naechste Iteration:
  - Restliche Rollenbibliotheken generieren.

## On-Prem Iteration 3 - Weitere Rollenbibliotheken
- Geaendert:
  - Generatorlauf fuer verbleibende 22 Rollen:
    - SMTP, Identity, Print, Exchange, SharePoint, SQL, Web/App, AVD, Bastion, WAF, LB, APIM, Monitor, Sentinel, Backup, ASR, Firewall/VPN, Patching, Intune, Key Vault, Messaging, Teams Phone.
  - Presets erneut aktualisiert (`scripts/generateOnPremPresets.js`), jetzt mit `LS-OPM-...` IDs.
- Getestet:
  - `node scripts/generateOnPremLeistungsscheine.js --roles=...`
  - `node scripts/generateOnPremPresets.js`
  - `node scripts/validateLeistungsscheine.js`
  - `node scripts/smokeCheck.js`
  - `node scripts/presetIntegrationCheck.js`
  - `node scripts/generateCheck.js`
  - `node scripts/uiModalCheck.js`
- Ergebnis:
  - +750 LS erzeugt, On-Prem Bibliothek gesamt: 870 LS.
  - Gesamtbestand: 1567 LS, Validator gruen.
- Naechste Iteration:
  - Optionales Delivery-Model-Filtering in UI.

## On-Prem Iteration 4 - Optional Delivery-Model Filter
- Geaendert:
  - `delivery_model` in Loader normalisiert (`lib/dataLoader.js`).
  - UI-Filter hinzugefuegt:
    - `public/index.html`: `#deliveryModelFilter`
    - `public/app.js`: Filterlogik + Anzeige als Card-Chip + Detailanzeige
    - `public/styles.css`: Toolbar auf 5 Spalten erweitert.
  - On-Prem LS tragen `delivery_model` (`managed_service_only` bzw. `managed_plus_vms` fuer AVD/ASR).
- Getestet:
  - `node scripts/validateLeistungsscheine.js`
  - `node scripts/smokeCheck.js`
  - `node scripts/presetIntegrationCheck.js`
  - `node scripts/generateCheck.js`
  - `node scripts/uiModalCheck.js`
- Ergebnis:
  - Optionaler Filter aktiv, keine Regression im Detail-Modal oder Generate-Flow.
