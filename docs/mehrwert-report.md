# Mehrwert Report

Erstellt am: 2026-02-09T09:41:55.773Z

## Aenderungsstatistik
- Leistungsscheine gesamt: 1567
- Ohne mehrwert vor Lauf: 0
- Geaenderte Dateien: 1503
- Migrierte Legacy-Felder (value/benefits/...): 0

## Domain Top-Counts
- onprem-migrationen: 870
- storage: 153
- compute: 107
- security: 71
- databases: 70
- devops: 57
- network: 56
- management_governance: 46
- integration: 28
- backup_dr: 22
- identity: 20
- migration: 20

## Theme Top-Counts
- onprem-apim-api-management: 30
- onprem-asr-azure-site-recovery: 30
- onprem-avd-azure-virtual-desktop: 30
- onprem-backup-azure-backup: 30
- onprem-bastion-azure-bastion: 30
- onprem-dns-private-dns-resolver: 30
- onprem-exchange-exchange-online: 30
- onprem-files-azure-files: 30
- onprem-files-sharepoint-onedrive: 30
- onprem-firewall-vpn-azure-firewall-vpn-er: 30
- onprem-identity-ad-entra-id-entra-ds: 30
- onprem-intune-microsoft-intune: 30

## Beispiele (10 zufaellige LS)
### LS-OPM-MONITOR-AZMON-BUILD-001 `data/leistungsscheine/onprem-migrationen/monitor/azure-monitor-log-analytics/03_build/LS-OPM-MONITOR-AZMON-BUILD-001__monitoring-plattform-azure-monitor-log-analytics-plattform-bereitstellung.json`
- Der Baustein "Monitoring Plattform -> Azure Monitor / Log Analytics: Plattform-Bereitstellung" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.
- Monitoring und Alerting werden als steuerbarer Betriebsprozess aufgesetzt, sodass Stoerungen frueh sichtbar und priorisiert bearbeitbar sind.
- Gegenueber reaktiver Fehlersuche ohne einheitliche Signale sinken Suchzeiten und Medienbrueche zwischen Fachbereich, Betrieb und Support.
- Das reduziert insbesondere das Risiko "Unvollstaendige Bestandsdaten oder nicht dokumentierte Altlasten fuehren zu Zusatzaufwand" und stabilisiert den Projektverlauf.
- Eindeutige Alarmwege, Schwellenwerte und Runbooks machen Incident-Bearbeitung messbar und wiederholbar.
- Der Build-Abschnitt stellt reproduzierbare Konfigurationsstaende bereit, was spaetere Betriebsuebernahmen deutlich vereinfacht.

### LS-OPM-APIM-APIM-TESTING-001 `data/leistungsscheine/onprem-migrationen/apim/api-management/06_testing/LS-OPM-APIM-APIM-TESTING-001__api-gateway-azure-api-management-funktionstestkatalog-ausfuehrung.json`
- Der Baustein "API Gateway -> Azure API Management: Funktionstestkatalog Ausfuehrung" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.
- Die Migration wird in nachvollziehbare Arbeitspakete mit Abnahmepunkten gegliedert, damit Aufwand, Zeitfenster und Abhaengigkeiten steuerbar bleiben.
- Im Vergleich zu ad-hoc Umstellungen ohne belastbares Runbook sinken Nacharbeiten, weil Reihenfolge und Verantwortlichkeiten vorab geklaert sind.
- Das reduziert insbesondere das Risiko "Unvollstaendige Bestandsdaten oder nicht dokumentierte Altlasten fuehren zu Zusatzaufwand" und stabilisiert den Projektverlauf.
- Transparente Restpunkte und Entscheidungslogs beschleunigen Folgewellen und vermeiden wiederkehrende Abstimmungsschleifen.
- API Management vereinheitlicht Zugriff, Schutz und Versionierung von Schnittstellen; gegenueber direkten Punkt-zu-Punkt-Integrationen sinken Betriebs- und Governance-Aufwaende.

### LS-OPM-DNS-AZDNSPR-CUTOVER-002 `data/leistungsscheine/onprem-migrationen/dns/private-dns-resolver/05_cutover/LS-OPM-DNS-AZDNSPR-CUTOVER-002__dns-server-hybrid-azure-private-dns-azure-dns-private-resolver-produktiv-cutover-durchfuehrung.json`
- Der Baustein "DNS Server (Hybrid) -> Azure Private DNS + Azure DNS Private Resolver: Produktiv-Cutover Durchfuehrung" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.
- Die Migration wird in nachvollziehbare Arbeitspakete mit Abnahmepunkten gegliedert, damit Aufwand, Zeitfenster und Abhaengigkeiten steuerbar bleiben.
- Im Vergleich zu ad-hoc Umstellungen ohne belastbares Runbook sinken Nacharbeiten, weil Reihenfolge und Verantwortlichkeiten vorab geklaert sind.
- Das reduziert insbesondere das Risiko "Unvollstaendige Bestandsdaten oder nicht dokumentierte Altlasten fuehren zu Zusatzaufwand" und stabilisiert den Projektverlauf.
- Transparente Restpunkte und Entscheidungslogs beschleunigen Folgewellen und vermeiden wiederkehrende Abstimmungsschleifen.
- Azure DNS Private Resolver zentralisiert hybride Namensaufloesung; gegenueber verteilten DNS-Forwardern sinken Betriebs- und Fehlerrisiken.

### LS-OPM-AVD-AVD-ASSESSMENT-003 `data/leistungsscheine/onprem-migrationen/avd/azure-virtual-desktop/01_assessment/LS-OPM-AVD-AVD-ASSESSMENT-003__rds-terminalserver-azure-virtual-desktop-readiness-report-und-priorisierung.json`
- Der Baustein "RDS / Terminalserver -> Azure Virtual Desktop: Readiness-Report und Priorisierung" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.
- Die Migration wird in nachvollziehbare Arbeitspakete mit Abnahmepunkten gegliedert, damit Aufwand, Zeitfenster und Abhaengigkeiten steuerbar bleiben.
- Im Vergleich zu ad-hoc Umstellungen ohne belastbares Runbook sinken Nacharbeiten, weil Reihenfolge und Verantwortlichkeiten vorab geklaert sind.
- Das reduziert insbesondere das Risiko "Unvollstaendige Bestandsdaten oder nicht dokumentierte Altlasten fuehren zu Zusatzaufwand" und stabilisiert den Projektverlauf.
- Transparente Restpunkte und Entscheidungslogs beschleunigen Folgewellen und vermeiden wiederkehrende Abstimmungsschleifen.
- Azure Virtual Desktop skaliert Session-Hosts bedarfsgerecht; gegenueber statischen VDI-Farmen wird Kapazitaet flexibler und transparenter steuerbar.

### LS-OPM-LOADBAL-AZLB-DESIGN-001 `data/leistungsscheine/onprem-migrationen/loadbalancer/azure-load-balancer/02_design/LS-OPM-LOADBAL-AZLB-DESIGN-001__l4-load-balancer-azure-load-balancer-zielarchitektur-und-entscheidungslog.json`
- Der Baustein "L4 Load Balancer -> Azure Load Balancer: Zielarchitektur und Entscheidungslog" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.
- Die Migration wird in nachvollziehbare Arbeitspakete mit Abnahmepunkten gegliedert, damit Aufwand, Zeitfenster und Abhaengigkeiten steuerbar bleiben.
- Im Vergleich zu ad-hoc Umstellungen ohne belastbares Runbook sinken Nacharbeiten, weil Reihenfolge und Verantwortlichkeiten vorab geklaert sind.
- Das reduziert insbesondere das Risiko "Unvollstaendige Bestandsdaten oder nicht dokumentierte Altlasten fuehren zu Zusatzaufwand" und stabilisiert den Projektverlauf.
- Transparente Restpunkte und Entscheidungslogs beschleunigen Folgewellen und vermeiden wiederkehrende Abstimmungsschleifen.
- Ein belastbares Design mit dokumentierten Entscheidungen verhindert spaete Architekturwechsel und ungeplante Re-Implementierungen.

### LS-OPM-KEYVAULT-AZKV-TESTING-001 `data/leistungsscheine/onprem-migrationen/keyvault/azure-key-vault/06_testing/LS-OPM-KEYVAULT-AZKV-TESTING-001__secrets-cert-store-azure-key-vault-funktionstestkatalog-ausfuehrung.json`
- Der Baustein "Secrets/Cert Store -> Azure Key Vault: Funktionstestkatalog Ausfuehrung" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.
- Die Migration wird in nachvollziehbare Arbeitspakete mit Abnahmepunkten gegliedert, damit Aufwand, Zeitfenster und Abhaengigkeiten steuerbar bleiben.
- Im Vergleich zu ad-hoc Umstellungen ohne belastbares Runbook sinken Nacharbeiten, weil Reihenfolge und Verantwortlichkeiten vorab geklaert sind.
- Das reduziert insbesondere das Risiko "Unvollstaendige Bestandsdaten oder nicht dokumentierte Altlasten fuehren zu Zusatzaufwand" und stabilisiert den Projektverlauf.
- Transparente Restpunkte und Entscheidungslogs beschleunigen Folgewellen und vermeiden wiederkehrende Abstimmungsschleifen.
- Key Vault zentralisiert Geheimnisse und Zertifikate; gegenueber verteilter Ablage sinkt das Risiko veralteter oder offengelegter Zugangsdaten.

### LS-1873 `data/leistungsscheine/_generated/12_backup_dr/backup/LS-1873__produkt-migration.json`
- Der Baustein "Produkt - Migration / Implementierung" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.
- Backup- und Wiederherstellungsprozesse werden als planbarer Betriebsprozess mit klaren Verantwortlichkeiten umgesetzt, nicht als seltene Einzelaktivitaet.
- Gegenueber dem Status quo ohne regelmaessig gepruefte Restore-Pfade steigt die Verlaesslichkeit bei Wiederanlauf und Datenrueckholung deutlich.
- Das reduziert insbesondere das Risiko "Unvollstaendige Bestandsinformationen fuehren zu Nacharbeit" und stabilisiert den Projektverlauf.
- Dokumentierte Nachweise fuer Schutzstatus, Retention und Wiederherstellbarkeit verbessern Auditfaehigkeit und Management-Entscheidungen.
- Schrittweise Migrationsdurchlaeufe mit klaren Pruefpunkten halten den Betrieb auch waehrend Umstellungen kontrollierbar.

### LS-OPM-AVD-AVD-BUILD-003 `data/leistungsscheine/onprem-migrationen/avd/azure-virtual-desktop/03_build/LS-OPM-AVD-AVD-BUILD-003__rds-terminalserver-azure-virtual-desktop-sicherheits-baseline-und-richtlinien.json`
- Der Baustein "RDS / Terminalserver -> Azure Virtual Desktop: Sicherheits-Baseline und Richtlinien" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.
- Die Migration wird in nachvollziehbare Arbeitspakete mit Abnahmepunkten gegliedert, damit Aufwand, Zeitfenster und Abhaengigkeiten steuerbar bleiben.
- Im Vergleich zu ad-hoc Umstellungen ohne belastbares Runbook sinken Nacharbeiten, weil Reihenfolge und Verantwortlichkeiten vorab geklaert sind.
- Das reduziert insbesondere das Risiko "Unvollstaendige Bestandsdaten oder nicht dokumentierte Altlasten fuehren zu Zusatzaufwand" und stabilisiert den Projektverlauf.
- Transparente Restpunkte und Entscheidungslogs beschleunigen Folgewellen und vermeiden wiederkehrende Abstimmungsschleifen.
- Azure Virtual Desktop skaliert Session-Hosts bedarfsgerecht; gegenueber statischen VDI-Farmen wird Kapazitaet flexibler und transparenter steuerbar.

### LS-2091 `data/leistungsscheine/_generated/09_management_governance/azure-policy/LS-2091__produkt-handover.json`
- Der Baustein "Produkt - Dokumentation / Handover" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.
- Governance und Kostensteuerung werden als laufender Steuerungsmechanismus etabliert, nicht erst nachgelagert bei Budgetabweichungen.
- Gegenueber unkoordiniertem Ressourcenwachstum verbessern sich Transparenz, Priorisierung und wirtschaftliche Steuerbarkeit der Plattform.
- Das reduziert insbesondere das Risiko "Unvollstaendige Bestandsinformationen fuehren zu Nacharbeit" und stabilisiert den Projektverlauf.
- Verbindliche Leitplanken machen Architekturentscheidungen schneller und konsistenter ueber Teams hinweg.
- Strukturierte Uebergabe mit Runbook und Restpunktelogik sichert Wissenstransfer und verkuerzt die Einregelungsphase im Betrieb.

### LS-OPM-MSG-SBEG-CHANGE-001 `data/leistungsscheine/onprem-migrationen/messaging/service-bus-event-grid/10_change_enablement/LS-OPM-MSG-SBEG-CHANGE-001__message-broker-azure-service-bus-event-grid-stakeholder-kommunikation-und-planung.json`
- Der Baustein "Message Broker -> Azure Service Bus / Event Grid: Stakeholder-Kommunikation und Planung" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.
- Kommunikation, Schulung und Uebergabe werden aktiv gesteuert, damit neue Betriebsprozesse schneller akzeptiert und korrekt genutzt werden.
- Gegenueber rein technischer Einfuehrung ohne Enablement sinken Rueckfragen, Medienbrueche und Nachsteuerungsaufwaende nach Go-Live.
- Das reduziert insbesondere das Risiko "Unvollstaendige Bestandsdaten oder nicht dokumentierte Altlasten fuehren zu Zusatzaufwand" und stabilisiert den Projektverlauf.
- Praxisnahe Leitfaeden und abgestimmte Eskalationswege stabilisieren den Regelbetrieb fruehzeitig.
- Service Bus und Event Grid entkoppeln Producer und Consumer; gegenueber synchronen Direktaufrufen sinkt die Stoeranfaelligkeit bei Lastspitzen.

## Potenziell zu generische Mehrwerte
- Keine potenziell generischen Eintraege erkannt.

_Hinweis: "Potenziell generisch" basiert auf einer heuristischen Wortlistenpruefung._
