const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..", "data", "leistungsscheine");
const REPORT_FILE = path.join(__dirname, "..", "docs", "enrichment-report.md");

function walkJsonFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkJsonFiles(fullPath, files);
      return;
    }
    if (entry.isFile() && fullPath.toLowerCase().endsWith(".json")) {
      files.push(fullPath);
    }
  });
  return files;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeText(value) {
  return String(value || "")
    .replace(/\u00A0/g, " ")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((item) => sanitizeText(item))
    .filter((item) => item.length > 0);
}

function domainDrivers(domain) {
  const drivers = {
    migration: ["Datenvolumen pro TB", "Anzahl Quellen/Shares", "Komplexitaet Berechtigungsmodell", "Verfuegbare Cutover-Fenster"],
    storage: ["Anzahl Storage Accounts", "Anzahl Shares und Quotas", "Private Endpoint und DNS-Aufwand", "Datenwachstum pro Monat"],
    network: ["Anzahl Netzsegmente", "Firewall/Freigabe-Prozesse", "DNS-Zonen und Forwarder", "Abhaengigkeit zu WAN/VPN"],
    identity: ["Anzahl Gruppen und ACLs", "Hybrid-Identity-Reifegrad", "Join/Auth-Methode", "Anzahl Testnutzer"],
    security: ["Policy-Dichte", "Regulatorische Anforderungen", "Anzahl Ausnahmen", "Logging/Retention-Vorgaben"],
    compute: ["Anzahl Workloads", "Betriebszeitfenster", "Image-/Baseline-Status", "Netzwerkintegration"],
    databases: ["Anzahl Datenbanken", "Datenvolumen und Wachstum", "Migrationsfenster", "Abhaengigkeit zu Anwendungen"],
    devops: ["Anzahl Pipelines", "IaC-Reifegrad", "Freigabeprozess", "Anzahl Umgebungen"],
    management_governance: ["Anzahl Subscriptions", "RBAC-Modell", "Policy-Umfang", "Reporting-Anforderungen"],
    integration: ["Anzahl Schnittstellen", "Auth/Token-Verfahren", "Retry-/DLQ-Design", "Betriebsuebergabe"],
    monitoring_ops: ["Anzahl Datenquellen", "Anzahl Alerts", "Schwellwertabstimmung", "Runbook-Reifegrad"],
    backup_dr: ["Anzahl Schutzobjekte", "Retention-Anforderungen", "Restore-Szenarien", "Wartungsfenster"],
    change_enablement: ["Anzahl Nutzergruppen", "Kommunikationskanaele", "Supportvolumen nach Go-Live", "Pilotgruppengroesse"],
    web_apps: ["Anzahl Anwendungen", "Slot-/Release-Strategie", "TLS/Netzwerkanforderungen", "Monitoring-Integrationen"],
    vdi: ["Anzahl Session Hosts", "Benutzerprofile", "Image-Lifecycle", "Storage-Performanceprofil"]
  };
  return drivers[domain] || ["Technische Komplexitaet", "Abhaengigkeiten zu Drittsystemen", "Freigabezyklen", "Datenqualitaet"];
}

function scopeQtyByDomain(domain) {
  const qty = {
    migration: { tb: 2, shares: 6, users: 120, files_million: 0.35 },
    storage: { tb: 2, shares: 6 },
    network: { shares: 6, users: 120 },
    identity: { users: 120, shares: 6 },
    security: { shares: 6 },
    monitoring_ops: { shares: 6, users: 120 },
    backup_dr: { tb: 2, shares: 6 },
    change_enablement: { users: 120 }
  };
  return qty[domain] || {};
}

function ensureMinItems(list, min, fillerFactory) {
  const out = [...list];
  while (out.length < min) {
    out.push(fillerFactory(out.length));
  }
  return out;
}

function buildIntro(module) {
  const title = sanitizeText(module.title);
  const theme = sanitizeText(module.theme || module.domain || "allgemein");
  return [
    `Dieser Leistungsschein beschreibt den klar abgegrenzten Teilleistungsumfang "${title}" innerhalb des Themenfelds ${theme}.`,
    "Die Aktivitaeten folgen einem nachvollziehbaren Ablauf aus Input-Klaerung, technischer Umsetzung und pruefbarer Ergebnisuebergabe.",
    "Ziel ist ein separat beauftragbares, dokumentiertes Ergebnis mit transparenten Annahmen, Abgrenzungen und Abnahmekriterien."
  ].join(" ");
}

function buildServices(module) {
  const title = sanitizeText(module.title);
  const base = [
    `Input-Aufnahme: Rahmenbedingungen, Systemgrenzen und Erfolgskriterien fuer ${title} mit den relevanten Stakeholdern abstimmen.`,
    "Ist-Analyse: aktuelle Konfiguration, Abhaengigkeiten und Risiken strukturiert erfassen und priorisieren.",
    `Design- bzw. Umsetzungsplan fuer ${title} inkl. Entscheidungsoptionen, Reihenfolge und Pruefpunkten erstellen.`,
    "Technische Umsetzung im vereinbarten Scope inklusive Nachweis der vorgenommenen Einstellungen/Schritte.",
    "Test und Validierung anhand definierter Checks; Abweichungen mit Massnahmenvorschlaegen dokumentieren.",
    "Ergebnisreview, Uebergabe und abgestimmte naechste Schritte inkl. Restpunkte und Verantwortlichkeiten festhalten."
  ];
  return base;
}

function buildDeliverables(module) {
  const title = sanitizeText(module.title);
  return [
    `Abgestimmter Arbeitsnachweis fuer ${title} (Scope, Grenzen, Entscheidungen).`,
    "Technische Parameter- und Konfigurationsliste mit Umsetzungsstatus.",
    "Testprotokoll mit dokumentierten Ergebnissen, Abweichungen und Freigabeempfehlung.",
    "Abnahme-/Uebergabeprotokoll inkl. offener Punkte und Verantwortlichkeiten.",
    "Risiko- und Massnahmenliste fuer die naechste Umsetzungsphase."
  ];
}

function buildAssumptions(module) {
  const domain = sanitizeText(module.domain);
  return [
    "Kundenseitig stehen fachliche und technische Ansprechpartner waehrend der Durchfuehrung termingerecht zur Verfuegung.",
    "Notwendige Zugriffe, Freigaben und Wartungsfenster werden vor Start des Arbeitspakets bereitgestellt.",
    `Abhaengige Teams (${domain}, Security, Netzwerk, Betrieb) liefern benoetigte Entscheidungen innerhalb vereinbarter Fristen.`,
    "Pilot-/Testnutzer und benoetigte Testdaten stehen fuer Validierung und Abnahme zur Verfuegung."
  ];
}

function buildConstraints() {
  return [
    "Aenderungen ausserhalb des abgestimmten Scopes werden nicht implizit umgesetzt.",
    "Abhaengigkeiten zu Drittanbietern oder internen Change-Prozessen koennen Terminverschiebungen verursachen.",
    "Nicht reproduzierbare Fehlerbilder ausserhalb des Testfensters koennen eine Nachanalyse erforderlich machen."
  ];
}

function buildOutOfScope() {
  return [
    "Dauerhafte Betriebsfuehrung/24x7-Support ausserhalb explizit vereinbarter Hypercare-Bausteine.",
    "Implementierung von Zusatzsystemen oder Fremdprodukten, die nicht im Leistungsschein benannt sind.",
    "Grundlegende Reorganisation von Governance-, Security- oder Netzwerkzielen ausserhalb des konkreten Outcomes."
  ];
}

function buildAcceptance(module) {
  const title = sanitizeText(module.title);
  return [
    `Alle fuer "${title}" geplanten Deliverables sind vollstaendig uebergeben und versioniert dokumentiert.`,
    "Mindestens drei definierte Funktions-/Integrationschecks wurden erfolgreich durchgefuehrt und protokolliert.",
    "Abweichungen, Restrisiken und offene Punkte sind mit klarer Verantwortlichkeit dokumentiert und abgestimmt."
  ];
}

function buildRisks() {
  return [
    "Unvollstaendige Ist-Daten oder spaete Entscheidungen fuehren zu Zusatzaufwand in Analyse und Umsetzung.",
    "Berechtigungs-/Netzwerkblocker verhindern Teiltests im geplanten Zeitfenster.",
    "Aenderungen am Scope waehrend der Umsetzung erzeugen Neuplanung und Priorisierungskonflikte."
  ];
}

function buildMitigations() {
  return [
    "Frueher Kickoff-Check fuer Zugriffe, Freigaben und Testdaten vor dem Umsetzungstermin.",
    "Regelmaessige Status- und Entscheidungsrunden mit dokumentierten To-dos und Eskalationspfad.",
    "Formalisierter Change-Control-Prozess mit Impact-Abschaetzung fuer Scope-Aenderungen."
  ];
}

function enrichModule(module) {
  const normalized = { ...module };
  normalized.title = sanitizeText(normalized.title);
  normalized.summary = sanitizeText(normalized.summary);
  normalized.theme = slugify(normalized.theme || normalized.domain || "general");
  normalized.tags = ensureMinItems(
    Array.from(new Set(sanitizeArray(normalized.tags).concat(["Azure", normalized.domain]))),
    3,
    (idx) => `Tag-${idx + 1}`
  );
  normalized.schema_version = "1.1.0";

  normalized.intro = buildIntro(normalized);
  normalized.services = ensureMinItems(sanitizeArray(buildServices(normalized)), 6, (idx) => `Service Schritt ${idx + 1}`);
  normalized.deliverables = ensureMinItems(
    sanitizeArray(buildDeliverables(normalized)),
    4,
    (idx) => `Deliverable ${idx + 1}`
  );
  normalized.assumptions = ensureMinItems(
    sanitizeArray(buildAssumptions(normalized)),
    3,
    (idx) => `Annahme ${idx + 1}`
  );
  normalized.constraints = ensureMinItems(sanitizeArray(buildConstraints()), 3, (idx) => `Constraint ${idx + 1}`);
  normalized.out_of_scope = ensureMinItems(
    sanitizeArray(buildOutOfScope()),
    3,
    (idx) => `Out of scope ${idx + 1}`
  );
  normalized.acceptance = ensureMinItems(
    sanitizeArray(buildAcceptance(normalized)),
    3,
    (idx) => `Abnahmekriterium ${idx + 1}`
  );
  normalized.scope = {
    description:
      sanitizeText(normalized.scope?.description) ||
      `Lieferumfang umfasst die klar abgegrenzte Umsetzung von ${normalized.id} (${normalized.title}) fuer das vereinbarte Zielbild.`,
    qty: {
      ...scopeQtyByDomain(normalized.domain),
      ...(normalized.scope?.qty && typeof normalized.scope.qty === "object" ? normalized.scope.qty : {})
    },
    boundaries: ensureMinItems(
      sanitizeArray(normalized.scope?.boundaries),
      3,
      (idx) => `Scope-Grenze ${idx + 1} wird separat bewertet und freigegeben.`
    )
  };
  normalized.effort_drivers = ensureMinItems(
    sanitizeArray(normalized.effort_drivers).length ? sanitizeArray(normalized.effort_drivers) : domainDrivers(normalized.domain),
    3,
    (idx) => `Treiber ${idx + 1}`
  );
  normalized.risks = ensureMinItems(sanitizeArray(normalized.risks).length ? sanitizeArray(normalized.risks) : buildRisks(), 3, (idx) => `Risiko ${idx + 1}`);
  normalized.mitigations = ensureMinItems(
    sanitizeArray(normalized.mitigations).length ? sanitizeArray(normalized.mitigations) : buildMitigations(),
    3,
    (idx) => `Massnahme ${idx + 1}`
  );
  normalized.customer_responsibilities = ensureMinItems(
    sanitizeArray(normalized.customer_responsibilities),
    3,
    (idx) => `Kundenmitwirkung ${idx + 1}`
  );
  normalized.provider_responsibilities = ensureMinItems(
    sanitizeArray(normalized.provider_responsibilities),
    3,
    (idx) => `Dienstleisterpflicht ${idx + 1}`
  );
  normalized.raci = {
    customer: ensureMinItems(sanitizeArray(normalized.raci?.customer), 2, (idx) => `Customer-Rolle ${idx + 1}`),
    provider: ensureMinItems(sanitizeArray(normalized.raci?.provider), 2, (idx) => `Provider-Rolle ${idx + 1}`)
  };
  normalized.change_control =
    sanitizeText(normalized.change_control) ||
    "Aenderungen am Scope werden ueber ein dokumentiertes Change-Control bewertet (Impact auf Aufwand, Termine, Risiken) und erst nach Freigabe umgesetzt.";
  normalized.dependencies = {
    requires: Array.from(new Set(sanitizeArray(normalized.dependencies?.requires))).filter((id) => /^LS-\d{4,}$/.test(id)),
    excludes: Array.from(new Set(sanitizeArray(normalized.dependencies?.excludes))).filter((id) => /^LS-\d{4,}$/.test(id))
  };
  if (normalized.notes !== undefined) {
    normalized.notes = sanitizeText(normalized.notes);
  }
  return normalized;
}

function getMaxId(modules) {
  let max = 1000;
  modules.forEach((entry) => {
    const match = String(entry.json.id || "").match(/^LS-(\d+)$/);
    if (!match) {
      return;
    }
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > max) {
      max = value;
    }
  });
  return max;
}

function createSplitModule(base, id, title, summary, services, deps, note) {
  const module = enrichModule({
    ...base,
    id,
    title,
    summary,
    source: {
      type: "generated",
      origin: "enrichment-split",
      url: base.source?.url || ""
    },
    services,
    notes: note,
    dependencies: {
      requires: deps.requires || [],
      excludes: deps.excludes || []
    }
  });
  return module;
}

function hasSplitMarker(modules, sourceId) {
  return modules.some((entry) => String(entry.json.notes || "").includes(`[split-of:${sourceId}]`));
}

function splitDecommission(base, nextIdRef) {
  const chain = [];
  const phaseSpecs = [
    {
      slug: "inventar-abhaengigkeiten",
      title: "Decommission Inventarisierung & Abhaengigkeiten",
      summary: "Inventar, Abhaengigkeiten und Abschaltvoraussetzungen dokumentieren.",
      services: [
        "Inventar aller Shares, Pfade, Freigaben und technischen Abhaengigkeiten erfassen.",
        "Abhaengige Dienste, Scripts, GPOs, DFS-Namespace und Batchjobs identifizieren.",
        "Abschaltvoraussetzungen in einer Freigabeliste mit Ownern dokumentieren.",
        "Risiken bei verfruehter Abschaltung bewerten und abstimmen.",
        "Freigabeprozess fuer Folgebausteine vorbereiten.",
        "Ergebnisse mit Betrieb und Applikationsverantwortlichen reviewen."
      ]
    },
    {
      slug: "cutover-kommunikation",
      title: "Decommission Cutover-Kommunikation & Zeitfenster",
      summary: "Kommunikation und Umstellungsfenster fuer geordnete Abschaltung abstimmen.",
      services: [
        "Kommunikationsplan fuer Nutzer, Service Desk und Stakeholder erstellen.",
        "Freeze-Fenster, Downtime-Kommunikation und Eskalationspfad abstimmen.",
        "Vorlagen fuer Ankuendigung, Reminder und Abschlussmeldung bereitstellen.",
        "Abhaengigkeiten zum Migrationscutover zeitlich synchronisieren.",
        "Fallback-Hinweise fuer kritische Nutzergruppen dokumentieren.",
        "Kommunikationsfreigabe mit Kunde und Betrieb durchfuehren."
      ]
    },
    {
      slug: "final-backup-retention",
      title: "Decommission Finales Backup & Retention-Freigabe",
      summary: "Finales Backup, Retention und Nachweisdokumentation vor Abschaltung sichern.",
      services: [
        "Finales Sicherungsszenario inkl. Retention-Vorgaben definieren.",
        "Backup-Lauf und Integritaetscheck fuer relevante Datenbereiche koordinieren.",
        "Restore-Nachweis fuer Stichproben oder kritische Pfade dokumentieren.",
        "Retention-Zeitraum und Zugriffsberechtigungen abstimmen.",
        "Archivierungsverantwortung festhalten.",
        "Freigabe fuer Abschaltung nach Backup-Nachweis einholen."
      ]
    },
    {
      slug: "dfs-gpo-script-anpassung",
      title: "Decommission DFS/GPO/Login-Script Anpassung",
      summary: "Abhaengige Pfadzuweisungen und Login-Automationen auf neue Zielpfade umstellen.",
      services: [
        "Bestehende DFS-Links und GPO-Mappings inventarisieren.",
        "Neue Zielpfade fuer Mappings, Scripts und Policies abstimmen.",
        "Anpassungen in Testgruppe einspielen und validieren.",
        "Rollout-Plan fuer produktive Richtlinienanpassung dokumentieren.",
        "Altpfad-Referenzen in Scripts identifizieren und bereinigen.",
        "Ergebnis- und Fehlerprotokoll mit Betrieb abstimmen."
      ]
    },
    {
      slug: "ad-dns-cleanup",
      title: "Decommission AD-Objekte und DNS-Cleanup",
      summary: "Nicht mehr benoetigte AD-/DNS-Objekte kontrolliert bereinigen.",
      services: [
        "Zu entfernende AD-Objekte und DNS-Eintraege in einer Freigabeliste zusammenstellen.",
        "Abhaengigkeiten zu Zertifikaten, SPNs und Servicekonten pruefen.",
        "Bereinigungsschritte im Change-Fenster ausfuehren.",
        "Namensaufloesung und Zugriffe nach Cleanup verifizieren.",
        "Rollback-Pfad fuer kritische Namensaufloesung dokumentieren.",
        "Cleanup-Nachweis inkl. Zeitstempel und Verantwortlichkeit ablegen."
      ]
    },
    {
      slug: "abschaltung-nachmonitoring",
      title: "Decommission Abschaltung & Nachmonitoring",
      summary: "Geordnete Abschaltung mit zeitlich begrenztem Nachmonitoring durchfuehren.",
      services: [
        "Abschaltcheckliste vor Ausserbetriebnahme abarbeiten.",
        "Serverdienste kontrolliert deaktivieren und Abschaltung durchfuehren.",
        "Kurzfristiges Nachmonitoring fuer Fehlerbilder im Nachgang etablieren.",
        "Incident-Pfad fuer Post-Cutover-Probleme aktivieren.",
        "Abschlussreview nach Monitoringfenster durchfuehren.",
        "Statusbericht fuer Betriebsuebergabe erstellen."
      ]
    },
    {
      slug: "cmdb-asset-abschluss",
      title: "Decommission CMDB/Asset-Abschluss",
      summary: "CMDB-, Asset- und Betriebsdokumentation nach Abschaltung abschliessen.",
      services: [
        "CMDB-Eintraege auf finalen Status aktualisieren.",
        "Asset-Lifecycle und Eigentuemerinformationen abschliessen.",
        "Stilllegungsnachweis fuer Audit und Betrieb dokumentieren.",
        "Betriebsdokumentation und Runbook-Verweise bereinigen.",
        "Vertragliche oder lizenzbezogene Abschlussaufgaben koordinieren.",
        "Finale Abschlussfreigabe mit Kunde einholen."
      ]
    }
  ];

  const ids = phaseSpecs.map(() => {
    nextIdRef.value += 1;
    return `LS-${String(nextIdRef.value).padStart(4, "0")}`;
  });

  phaseSpecs.forEach((spec, index) => {
    const requires = [];
    if (index > 0) {
      requires.push(ids[index - 1]);
    }
    const module = createSplitModule(
      base,
      ids[index],
      spec.title,
      spec.summary,
      spec.services,
      { requires, excludes: [] },
      `[split-of:${base.id}] ${spec.slug}`
    );
    chain.push(module);
  });
  return chain;
}

function splitMonitoring(base, nextIdRef) {
  const specs = [
    {
      slug: "workspace-datenerfassung",
      title: "Monitoring Workspace & Datenerfassung Setup",
      summary: "Datenaufnahme fuer Logs/Metriken standardisiert einrichten.",
      services: [
        "Signalquellen und notwendige Datentypen definieren.",
        "Workspace-Struktur und Datenaufbewahrung abstimmen.",
        "Datenerfassung fuer relevante Ressourcen aktivieren.",
        "Namenskonvention und Tagging fuer Monitoringobjekte anwenden.",
        "Berechtigungen fuer Monitoringzugriff abstimmen.",
        "Initiale Datenfluesse pruefen und dokumentieren."
      ]
    },
    {
      slug: "alert-rules-basisset",
      title: "Monitoring Alert-Regeln Basisset",
      summary: "Betriebsrelevante Alerts und Schwellwerte umsetzen.",
      services: [
        "Kritische Ereignisse und KPI-Schwellenwerte mit Betrieb abstimmen.",
        "Alert-Regeln fuer Verfuegbarkeit, Fehler und Performance konfigurieren.",
        "Benachrichtigungskanaele und Eskalationsstufen verknuepfen.",
        "Rauscharme Schwellwerte fuer Pilotphase definieren.",
        "Fehlalarm-Handling dokumentieren.",
        "Regeltests mit Testevents durchfuehren."
      ]
    },
    {
      slug: "dashboard-operative-sicht",
      title: "Monitoring Dashboard Operative Sicht",
      summary: "Ein operatives Dashboard fuer Betrieb und Hypercare bereitstellen.",
      services: [
        "Use-Cases fuer Betrieb, Service Desk und Projektteam aufnehmen.",
        "Dashboard-Layout mit Kernmetriken und Drilldown erstellen.",
        "Sichtbarkeit fuer kritische Ressourcen und Trends abbilden.",
        "Filter/Zeitraeume fuer taegliche Betriebsroutinen konfigurieren.",
        "Zugriffsrollen fuer Dashboard-Nutzung abstimmen.",
        "Abnahme-Durchlauf mit Pilotgruppe protokollieren."
      ]
    },
    {
      slug: "runbook-eskalation",
      title: "Monitoring Runbook & Eskalationspfad",
      summary: "Runbook fuer Alarmreaktion und Eskalation definieren.",
      services: [
        "Alarmklassen und priorisierte Reaktionspfade definieren.",
        "Runbook-Schritte je Alert-Typ dokumentieren.",
        "Schnittstellen zu Ticketing/ITSM und Ownership festlegen.",
        "Eskalationsgrenzen und Ansprechpartner hinterlegen.",
        "Betriebsuebung mit Beispielstoerung durchfuehren.",
        "Runbook-Freigabe mit Betrieb verankern."
      ]
    },
    {
      slug: "tuning-pilotphase",
      title: "Monitoring Tuning nach Pilotphase",
      summary: "Alert- und Dashboard-Tuning auf Basis realer Betriebsdaten.",
      services: [
        "Pilotdaten zu Alerts, False Positives und Reaktionszeiten auswerten.",
        "Schwellwerte, Aggregationen und Filter gezielt nachjustieren.",
        "Nicht hilfreiche Alarme reduzieren und Priorisierung schaerfen.",
        "Runbook-Annahmen mit realen Faellen abgleichen.",
        "Verbesserungsvorschlaege fuer naechste Iteration dokumentieren.",
        "Abschlussreview fuer den tuned Betriebssatz durchfuehren."
      ]
    }
  ];
  const modules = [];
  const ids = specs.map(() => {
    nextIdRef.value += 1;
    return `LS-${String(nextIdRef.value).padStart(4, "0")}`;
  });
  specs.forEach((spec, index) => {
    const requires = [];
    if (index > 0) {
      requires.push(ids[index - 1]);
    }
    const module = createSplitModule(
      base,
      ids[index],
      spec.title,
      spec.summary,
      spec.services,
      { requires, excludes: [] },
      `[split-of:${base.id}] ${spec.slug}`
    );
    modules.push(module);
  });
  return modules;
}

function writeReport(report) {
  const lines = [
    "# Enrichment Report",
    "",
    `- Zeitpunkt: ${new Date().toISOString()}`,
    `- Gelesene LS: ${report.totalBefore}`,
    `- Aktualisierte LS: ${report.enriched}`,
    `- Neu erzeugte Split-LS: ${report.createdSplits.length}`,
    `- Bestand nach Lauf: ${report.totalAfter}`,
    "",
    "## Ergaenzte/standardisierte Felder",
    "- intro (2-4 Saetze, kontextbezogen)",
    "- services (>= 6 spezifische Schritte mit Input/Aktivitaet/Output)",
    "- deliverables (>= 4 konkrete Artefakte)",
    "- assumptions/constraints/out_of_scope/acceptance (konkret und testbar)",
    "- scope inkl. boundaries und qty-Heuristik",
    "- effort_drivers, risks, mitigations",
    "- customer/provider responsibilities, raci, change_control",
    "",
    "## Splits (alt -> neu)",
    ...(report.splitMappings.length
      ? report.splitMappings.map((item) => `- ${item.from} -> ${item.to.join(", ")}`)
      : ["- Keine Splits im Lauf erzeugt."])
  ];
  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const files = walkJsonFiles(ROOT_DIR, []);
  if (!files.length) {
    throw new Error("Keine Leistungsschein-Dateien gefunden.");
  }

  const records = files.map((filePath) => ({
    filePath,
    json: JSON.parse(fs.readFileSync(filePath, "utf8"))
  }));
  const maxId = getMaxId(records);
  const nextIdRef = { value: maxId };

  let enriched = 0;
  records.forEach((record) => {
    record.json = enrichModule(record.json);
    fs.writeFileSync(record.filePath, `${JSON.stringify(record.json, null, 2)}\n`, "utf8");
    enriched += 1;
  });

  const splitMappings = [];
  const createdSplits = [];
  const enrichedRecords = records.map((record) => ({ ...record }));

  const decommissionBase = enrichedRecords.find((record) => record.json.id === "LS-1008");
  if (decommissionBase && !hasSplitMarker(enrichedRecords, "LS-1008")) {
    const splitModules = splitDecommission(decommissionBase.json, nextIdRef);
    splitModules.forEach((module) => {
      const fileName = `${module.id}__${slugify(module.title)}.json`;
      const targetPath = path.join(path.dirname(decommissionBase.filePath), fileName);
      fs.writeFileSync(targetPath, `${JSON.stringify(module, null, 2)}\n`, "utf8");
      createdSplits.push(targetPath);
    });
    splitMappings.push({ from: "LS-1008", to: splitModules.map((module) => module.id) });
  }

  const monitoringBase = enrichedRecords.find((record) => record.json.id === "LS-1015");
  if (monitoringBase && !hasSplitMarker(enrichedRecords, "LS-1015")) {
    const splitModules = splitMonitoring(monitoringBase.json, nextIdRef);
    splitModules.forEach((module) => {
      const fileName = `${module.id}__${slugify(module.title)}.json`;
      const targetPath = path.join(path.dirname(monitoringBase.filePath), fileName);
      fs.writeFileSync(targetPath, `${JSON.stringify(module, null, 2)}\n`, "utf8");
      createdSplits.push(targetPath);
    });
    splitMappings.push({ from: "LS-1015", to: splitModules.map((module) => module.id) });
  }

  const afterCount = walkJsonFiles(ROOT_DIR, []).length;
  writeReport({
    totalBefore: records.length,
    totalAfter: afterCount,
    enriched,
    createdSplits,
    splitMappings
  });

  console.log(
    `[enrich] enriched=${enriched} splits=${createdSplits.length} before=${records.length} after=${afterCount}`
  );
}

try {
  main();
} catch (error) {
  console.error(`[enrich] Fehler: ${error.message}`);
  process.exit(1);
}
