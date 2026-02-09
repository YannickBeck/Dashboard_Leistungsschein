# Gap-Analyse Leistungsschein-Bibliothek (Iteration 0)

## Ist-Aufnahme
- Gesamtbestand (rekursiv unter `data/leistungsscheine/`): **460** JSON-Dateien.
- Aktuelle Qualitaetsmetriken (automatischer Check):
  - Intro < 2 Saetze: **460/460**
  - Services < 6 Punkte: **460/460**
  - Deliverables < 4 Punkte: **460/460**
  - Acceptance < 3 Punkte: **460/460**
  - Out-of-scope < 3 Punkte: **460/460**
  - Assumptions < 3 Punkte: **460/460**
  - Fehlendes `scope`: **460/460**
  - Fehlende `effort_drivers`: **460/460**
  - Fehlendes `change_control`: **460/460**

## Hauptluecken
- Inhalte sind zu generisch:
  - `intro` oft nur 1 Satz ohne Kontext, ohne messbares Ergebnis.
  - `services` beschreibt Aktivitaeten nur abstrakt ("Workshop/Umsetzung/Review").
  - `deliverables` sind zu kurz und nicht auditierbar.
  - `acceptance` ist nicht testbar/messbar.
- Mengen- und Scope-Treiber fehlen:
  - Keine strukturierte Quantifizierung (z. B. `tb`, `shares`, `users`, `files_million`).
  - Keine Treiber fuer Aufwandsschaetzung (`effort_drivers`).
- Governance-/Verantwortungsfelder fehlen:
  - Keine klaren Mitwirkungspflichten (`customer_responsibilities`, `provider_responsibilities`).
  - Kein RACI-Schnitt.
  - Kein `change_control` fuer Scope-Aenderungen.
- Teilweise zu breite LS:
  - Vor allem Themen wie Decommission, Monitoring/Ops, Migration/Cutover sind oft als Sammelbaustein modelliert.
  - Diese sollen in klar beauftragbare Outcomes gesplittet werden (Assessment, Design, Build, Testing, Handover, Ops/Add-ons).

## Abgeleitete Qualitaetsregeln (ab Iteration 1 verbindlich)
1. Ein LS darf maximal **ein klar abgrenzbares Outcome** adressieren.
2. Abnahmekriterien muessen **messbar/testbar** sein.
3. `out_of_scope` muss **konkret und abgrenzend** sein.
4. `assumptions` muessen **Mitwirkung/RACI** enthalten.
5. Jeder LS benoetigt:
   - `scope` inkl. optionaler Mengenangaben,
   - `effort_drivers`,
   - `risks` + `mitigations`,
   - `change_control`.
6. Mindesttiefe je LS:
   - Intro >= 2 Saetze
   - Services >= 6 Punkte
   - Deliverables >= 4 Punkte
   - Acceptance >= 3 Punkte
   - Out-of-scope >= 3 Punkte
   - Assumptions >= 3 Punkte
