const fs = require("fs");
const path = require("path");

const OUTPUT_ROOT = path.join(
  __dirname,
  "..",
  "data",
  "leistungsscheine",
  "onprem-migrationen"
);

const PHASES = [
  { folder: "01_assessment", code: "ASSESSMENT", label: "Assessment", base: { min: 1, likely: 2, max: 3 } },
  { folder: "02_design", code: "DESIGN", label: "Design", base: { min: 1, likely: 2, max: 4 } },
  { folder: "03_build", code: "BUILD", label: "Build", base: { min: 2, likely: 3, max: 5 } },
  { folder: "04_migration", code: "MIGRATION", label: "Migration", base: { min: 2, likely: 4, max: 7 } },
  { folder: "05_cutover", code: "CUTOVER", label: "Cutover", base: { min: 1, likely: 2, max: 4 } },
  { folder: "06_testing", code: "TESTING", label: "Testing", base: { min: 1, likely: 2, max: 3 } },
  { folder: "07_handover", code: "HANDOVER", label: "Handover", base: { min: 1, likely: 2, max: 3 } },
  { folder: "08_ops", code: "OPS", label: "Ops", base: { min: 1, likely: 2, max: 4 } },
  { folder: "09_optimization", code: "OPTIMIZATION", label: "Optimization", base: { min: 1, likely: 2, max: 3 } },
  {
    folder: "10_change_enablement",
    code: "CHANGE",
    label: "Change Enablement",
    base: { min: 1, likely: 2, max: 3 }
  }
];

const TASKS_BY_PHASE = {
  ASSESSMENT: [
    "Inventarisierung und Scope-Baseline",
    "Abhaengigkeiten und Risikoanalyse",
    "Readiness-Report und Priorisierung"
  ],
  DESIGN: [
    "Zielarchitektur und Entscheidungslog",
    "Security-/Identity-Design",
    "Migrations- und Backout-Design"
  ],
  BUILD: [
    "Plattform-Bereitstellung",
    "Netzwerk- und Konnektivitaetskonfiguration",
    "Sicherheits-Baseline und Richtlinien"
  ],
  MIGRATION: [
    "Migrationsvorbereitung und Pre-Stage",
    "Migrationsdurchlauf Delta/Batches",
    "Fehlerbehebung und Nachmigration"
  ],
  CUTOVER: [
    "Cutover Readiness Review",
    "Produktiv-Cutover Durchfuehrung",
    "Backout- und Stabilisierungsfenster"
  ],
  TESTING: [
    "Funktionstestkatalog Ausfuehrung",
    "Security-/Performance-Tests",
    "Pilot/UAT und Abnahmeempfehlung"
  ],
  HANDOVER: [
    "Runbook und Betriebsdokumentation",
    "Knowledge Transfer Admin-Team",
    "Uebergabeprotokoll und Restpunkte"
  ],
  OPS: [
    "Monitoring- und Alerting-Betriebsset",
    "Incident-/Serviceprozess-Verankerung",
    "Regelbetriebs-Startunterstuetzung"
  ],
  OPTIMIZATION: [
    "Kostenoptimierung und FinOps-Hebel",
    "Performance-Tuning und Kapazitaet",
    "Governance-/Compliance-Nachschaerfung"
  ],
  CHANGE: [
    "Stakeholder-Kommunikation und Planung",
    "Endanwender-Schulung und How-To",
    "Hypercare und Feedback-Loop"
  ]
};

const ROLES = [
  {
    key: "smtp-relay",
    code: "SMTP",
    onPrem: "SMTP Relay / Bulk Mail",
    domain: "onprem-migrationen",
    qty: { users: 150 },
    effort_drivers: ["Mailvolumen pro Tag", "Anzahl Absenderdomainen", "SMTP-Auth-Szenarien", "Compliance-Anforderungen"],
    targets: [{ key: "acs-email", code: "ACSEMAIL", name: "Azure Communication Services - Email", delivery_model: "managed_service_only" }]
  },
  {
    key: "identity-ad",
    code: "IDAD",
    onPrem: "Domain Controller (AD DS)",
    domain: "onprem-migrationen",
    qty: { users: 250 },
    effort_drivers: ["Anzahl Benutzer/Gruppen", "Trust-/Forest-Komplexitaet", "Legacy-Auth-Abhaengigkeiten", "Rollen-/Rechtebereinigung"],
    targets: [{ key: "entra-id-entra-ds", code: "ENTRADS", name: "Microsoft Entra ID + Entra Domain Services", delivery_model: "managed_service_only" }]
  },
  {
    key: "files",
    code: "FILES",
    onPrem: "Fileserver",
    domain: "onprem-migrationen",
    qty: { shares: 12, tb: 4, users: 180, files_million: 0.9 },
    effort_drivers: ["Datenvolumen pro TB", "Anzahl Shares", "NTFS-ACL-Komplexitaet", "Pfad-/Applikationsabhaengigkeiten"],
    mutuallyExclusiveTargets: true,
    targets: [
      { key: "azure-files", code: "AZFILES", name: "Azure Files", delivery_model: "managed_service_only" },
      { key: "sharepoint-onedrive", code: "SPOD", name: "SharePoint Online / OneDrive", delivery_model: "managed_service_only" }
    ]
  },
  {
    key: "print",
    code: "PRINT",
    onPrem: "Printserver",
    domain: "onprem-migrationen",
    qty: { users: 150 },
    effort_drivers: ["Anzahl Druckerqueues", "Treiberkompatibilitaet", "Standortanzahl", "Secure-Print-Anforderungen"],
    targets: [{ key: "universal-print", code: "UPRINT", name: "Universal Print", delivery_model: "managed_service_only" }]
  },
  {
    key: "exchange",
    code: "EXCHANGE",
    onPrem: "Exchange Server",
    domain: "onprem-migrationen",
    qty: { users: 220 },
    effort_drivers: ["Mailbox-Anzahl/Groesse", "Mailflow-/Connector-Komplexitaet", "Compliance-Anforderungen", "Downtime-Fenster"],
    targets: [{ key: "exchange-online", code: "EXO", name: "Exchange Online", delivery_model: "managed_service_only" }]
  },
  {
    key: "sharepoint",
    code: "SHAREPOINT",
    onPrem: "SharePoint Server",
    domain: "onprem-migrationen",
    qty: { users: 200 },
    effort_drivers: ["Site Collection Anzahl", "Customizations/Add-ins", "Berechtigungsmodell", "Datenvolumen"],
    targets: [{ key: "sharepoint-online", code: "SPONLINE", name: "SharePoint Online", delivery_model: "managed_service_only" }]
  },
  {
    key: "sql",
    code: "SQL",
    onPrem: "SQL Server",
    domain: "onprem-migrationen",
    qty: { users: 60, tb: 2 },
    effort_drivers: ["DB-Anzahl/Groesse", "Feature-Kompatibilitaet", "Agent Jobs/Linked Servers", "Downtime-Toleranz"],
    mutuallyExclusiveTargets: true,
    targets: [
      { key: "azure-sql-mi", code: "AZSQLMI", name: "Azure SQL Managed Instance", delivery_model: "managed_service_only" },
      { key: "azure-sql-db", code: "AZSQLDB", name: "Azure SQL Database", delivery_model: "managed_service_only" }
    ]
  },
  {
    key: "web-app",
    code: "WEBAPP",
    onPrem: "Web/App Server",
    domain: "onprem-migrationen",
    qty: { users: 120 },
    effort_drivers: ["Anzahl Anwendungen", "Runtime-Abhaengigkeiten", "Netzwerk-/TLS-Anforderungen", "Release- und Rollbackfenster"],
    targets: [
      { key: "app-service", code: "APPSVC", name: "Azure App Service", delivery_model: "managed_service_only" },
      { key: "azure-functions", code: "AZFUNC", name: "Azure Functions", delivery_model: "managed_service_only" }
    ]
  },
  {
    key: "avd",
    code: "AVD",
    onPrem: "RDS / Terminalserver",
    domain: "onprem-migrationen",
    qty: { users: 180 },
    effort_drivers: ["Session Host Anzahl", "User Profile / FSLogix", "Anwendungsbereitstellung", "Netzwerk-Latenz"],
    targets: [{ key: "azure-virtual-desktop", code: "AVD", name: "Azure Virtual Desktop", delivery_model: "managed_plus_vms" }]
  },
  {
    key: "sftp",
    code: "SFTP",
    onPrem: "SFTP Server",
    domain: "onprem-migrationen",
    qty: { tb: 3, users: 40 },
    effort_drivers: ["Dateivolumen", "Partner-/Useranzahl", "SSH-Key-Management", "Transferfenster"],
    targets: [{ key: "blob-sftp", code: "BLOBSFTP", name: "Azure Blob Storage mit SFTP", delivery_model: "managed_service_only" }]
  },
  {
    key: "dns",
    code: "DNS",
    onPrem: "DNS Server (Hybrid)",
    domain: "onprem-migrationen",
    qty: { users: 250 },
    effort_drivers: ["Zonenanzahl", "Conditional Forwarders", "Hybrid-Namensaufloesung", "Resolver-Regelumfang"],
    targets: [{ key: "private-dns-resolver", code: "AZDNSPR", name: "Azure Private DNS + Azure DNS Private Resolver", delivery_model: "managed_service_only" }]
  },
  {
    key: "bastion",
    code: "BASTION",
    onPrem: "Jumpserver / Bastion Host",
    domain: "onprem-migrationen",
    qty: { users: 30 },
    effort_drivers: ["Admin-Benutzeranzahl", "Zielnetzsegmente", "RDP/SSH-Nutzungsmuster", "Harte Security-Vorgaben"],
    targets: [{ key: "azure-bastion", code: "BASTION", name: "Azure Bastion", delivery_model: "managed_service_only" }]
  },
  {
    key: "waf",
    code: "WAF",
    onPrem: "Reverse Proxy / WAF",
    domain: "onprem-migrationen",
    qty: { users: 300 },
    effort_drivers: ["Anzahl publizierter Apps", "WAF-Regelset-Komplexitaet", "TLS/Cert-Lifecycle", "Geo-/Routing-Anforderungen"],
    mutuallyExclusiveTargets: true,
    targets: [
      { key: "application-gateway-waf", code: "AGWAF", name: "Application Gateway (WAF)", delivery_model: "managed_service_only" },
      { key: "front-door-waf", code: "AZFDWAF", name: "Azure Front Door (WAF)", delivery_model: "managed_service_only" }
    ]
  },
  {
    key: "loadbalancer",
    code: "LOADBAL",
    onPrem: "L4 Load Balancer",
    domain: "onprem-migrationen",
    qty: { users: 250 },
    effort_drivers: ["Anzahl Services", "Probe-/Healthcheck-Design", "SNAT/Inbound-Regeln", "Failover-Anforderungen"],
    targets: [{ key: "azure-load-balancer", code: "AZLB", name: "Azure Load Balancer", delivery_model: "managed_service_only" }]
  },
  {
    key: "apim",
    code: "APIM",
    onPrem: "API Gateway",
    domain: "onprem-migrationen",
    qty: { users: 80 },
    effort_drivers: ["API-Anzahl", "Policy-Komplexitaet", "Auth-/OAuth-Szenarien", "Versionierungsmodell"],
    targets: [{ key: "api-management", code: "APIM", name: "Azure API Management", delivery_model: "managed_service_only" }]
  },
  {
    key: "monitor",
    code: "MONITOR",
    onPrem: "Monitoring Plattform",
    domain: "onprem-migrationen",
    qty: { users: 40 },
    effort_drivers: ["Signalquellen", "Alert-Volumen", "Runbook-Reifegrad", "SOC-/Ops-Integrationen"],
    targets: [{ key: "azure-monitor-log-analytics", code: "AZMON", name: "Azure Monitor / Log Analytics", delivery_model: "managed_service_only" }]
  },
  {
    key: "sentinel",
    code: "SENTINEL",
    onPrem: "SIEM",
    domain: "onprem-migrationen",
    qty: { users: 35 },
    effort_drivers: ["Data Connectors", "Detection Rules", "Incident Volumen", "SOC-Prozessreife"],
    targets: [{ key: "microsoft-sentinel", code: "SENTINEL", name: "Microsoft Sentinel", delivery_model: "managed_service_only" }]
  },
  {
    key: "backup",
    code: "BACKUP",
    onPrem: "Backup Plattform",
    domain: "onprem-migrationen",
    qty: { tb: 4 },
    effort_drivers: ["Schutzobjekt-Anzahl", "Retention-Klassen", "Restore-Ziele", "Vault-/Policy-Struktur"],
    targets: [{ key: "azure-backup", code: "AZBACKUP", name: "Azure Backup", delivery_model: "managed_service_only" }]
  },
  {
    key: "asr",
    code: "ASR",
    onPrem: "Disaster Recovery",
    domain: "onprem-migrationen",
    qty: { users: 120 },
    effort_drivers: ["Replizierte Workloads", "RPO/RTO Zielwerte", "Failover-Orchestrierung", "DR-Testfenster"],
    targets: [{ key: "azure-site-recovery", code: "ASR", name: "Azure Site Recovery", delivery_model: "managed_plus_vms" }]
  },
  {
    key: "firewall-vpn",
    code: "FIREWVPN",
    onPrem: "Firewall/VPN Gateway",
    domain: "onprem-migrationen",
    qty: { users: 220 },
    effort_drivers: ["Regelwerk-Groesse", "Standortanzahl", "VPN/ER-Topologie", "Security-Freigabeprozesse"],
    targets: [{ key: "azure-firewall-vpn-er", code: "AZFWVPN", name: "Azure Firewall + VPN/ER", delivery_model: "managed_service_only" }]
  },
  {
    key: "patching",
    code: "PATCH",
    onPrem: "WSUS/Patch Management",
    domain: "onprem-migrationen",
    qty: { users: 150 },
    effort_drivers: ["Endpunktanzahl", "Patch-Ringe", "Wartungsfenster", "Compliance-Reporting"],
    targets: [{ key: "azure-update-manager-autopatch", code: "AUMAP", name: "Azure Update Manager / Windows Autopatch", delivery_model: "managed_service_only" }]
  },
  {
    key: "intune",
    code: "INTUNE",
    onPrem: "SCCM-lastiges Endpoint Management",
    domain: "onprem-migrationen",
    qty: { users: 180 },
    effort_drivers: ["Device-Anzahl", "Enrollment-Varianten", "Policy-Komplexitaet", "App-Rollout-Sets"],
    targets: [{ key: "microsoft-intune", code: "INTUNE", name: "Microsoft Intune", delivery_model: "managed_service_only" }]
  },
  {
    key: "keyvault",
    code: "KEYVAULT",
    onPrem: "Secrets/Cert Store",
    domain: "onprem-migrationen",
    qty: { users: 40 },
    effort_drivers: ["Secret-/Cert-Anzahl", "Rotation Policies", "App-Integrationen", "HSM/Compliance-Vorgaben"],
    targets: [{ key: "azure-key-vault", code: "AZKV", name: "Azure Key Vault", delivery_model: "managed_service_only" }]
  },
  {
    key: "messaging",
    code: "MSG",
    onPrem: "Message Broker",
    domain: "onprem-migrationen",
    qty: { users: 60 },
    effort_drivers: ["Queue/Topic-Anzahl", "Nachrichtenvolumen", "Retry/DLQ-Design", "Consumer-Abhaengigkeiten"],
    targets: [{ key: "service-bus-event-grid", code: "SBEG", name: "Azure Service Bus / Event Grid", delivery_model: "managed_service_only" }]
  },
  {
    key: "teams-phone",
    code: "TEAMSPH",
    onPrem: "PBX",
    domain: "onprem-migrationen",
    qty: { users: 200 },
    effort_drivers: ["Rufnummernblock", "SBC-/Carrier-Abhaengigkeiten", "Callflow-Komplexitaet", "Pilotgruppenumfang"],
    targets: [{ key: "teams-phone", code: "TPHONE", name: "Microsoft Teams Phone", delivery_model: "managed_service_only" }]
  }
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { clean: false, roles: null };
  args.forEach((arg) => {
    if (arg === "--clean") {
      out.clean = true;
      return;
    }
    if (arg.startsWith("--roles=")) {
      const value = arg.slice("--roles=".length);
      out.roles = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  });
  return out;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureArray(values) {
  return Array.isArray(values) ? values : [];
}

function estimateWithComplexity(base, taskIndex, role) {
  const roleBoost = Math.min(2, Math.max(0, Math.floor((ensureArray(role.effort_drivers).length - 2) / 2)));
  return {
    unit: "PT",
    min: base.min,
    likely: base.likely + roleBoost + (taskIndex > 0 ? 1 : 0),
    max: base.max + roleBoost + (taskIndex > 1 ? 1 : 0)
  };
}

function buildScopeQty(role) {
  const qty = role.qty && typeof role.qty === "object" ? role.qty : {};
  return {
    shares: Number.isFinite(Number(qty.shares)) ? Number(qty.shares) : undefined,
    tb: Number.isFinite(Number(qty.tb)) ? Number(qty.tb) : undefined,
    users: Number.isFinite(Number(qty.users)) ? Number(qty.users) : undefined,
    files_million: Number.isFinite(Number(qty.files_million)) ? Number(qty.files_million) : undefined
  };
}

function cleanQty(qty) {
  const out = {};
  Object.entries(qty).forEach(([key, value]) => {
    if (value !== undefined) {
      out[key] = value;
    }
  });
  return out;
}

function buildModule({
  role,
  target,
  phase,
  taskName,
  taskIndex,
  id,
  requires,
  excludes
}) {
  const targetName = target.name;
  const outcome = `${phase.label} - ${taskName}`;
  const summary = `${outcome} fuer die Migration von ${role.onPrem} nach ${targetName} als separat beauftragbarer Teilleistungsumfang.`;
  const estimate = estimateWithComplexity(phase.base, taskIndex, role);
  const qty = cleanQty(buildScopeQty(role));

  return {
    schema_version: "1.1.0",
    id,
    title: `${role.onPrem} -> ${targetName}: ${taskName}`,
    domain: role.domain,
    theme: `onprem-${role.key}-${target.key}`,
    summary,
    tags: [
      "On-Prem",
      "Migration",
      role.key,
      target.key,
      phase.code,
      targetName
    ],
    source: {
      type: "generated",
      origin: "onprem-migration-library",
      url: ""
    },
    estimate,
    delivery_model: target.delivery_model || "managed_service_only",
    intro: `Der Leistungsschein adressiert den Baustein "${taskName}" in der Phase ${phase.label} fuer die Migration von ${role.onPrem} nach ${targetName}. Ziel ist ein klar abgrenzbares Ergebnis mit nachvollziehbarer Dokumentation, das separat beauftragt und abgenommen werden kann. Der Scope umfasst nur die in diesem Baustein beschriebenen Aktivitaeten inklusive Test- und Uebergabenachweisen.`,
    services: [
      `Input- und Scope-Klaerung fuer ${taskName} mit fachlichen und technischen Ansprechpartnern.`,
      `Analyse der aktuellen ${role.onPrem}-Auspraegung inklusive Abhaengigkeiten zum Ziel ${targetName}.`,
      "Erstellung der konkreten Arbeitsschritte inkl. Reihenfolge, Zeitfenster und Verantwortlichkeiten.",
      "Durchfuehrung der technischen Aufgaben gemaess abgestimmtem Plan und dokumentierter Parameter.",
      "Validierung ueber definierte Tests/Checks mit protokollierten Ergebnissen und Abweichungen.",
      "Review, Ergebnisfreigabe und Uebergabe inkl. Restpunkte- und Risikoabstimmung."
    ],
    deliverables: [
      `${phase.label}-Arbeitsprotokoll fuer ${taskName}.`,
      "Entscheidungslog inkl. Parameter- und Konfigurationsliste.",
      "Test- und Evidenzprotokoll mit Status je Pruefpunkt.",
      "Abnahmeprotokoll inkl. offener Punkte und Verantwortlichkeiten.",
      "Backout-/Stabilisierungscheckliste (sofern fuer Phase relevant)."
    ],
    assumptions: [
      "Kundenseitig sind technische und fachliche Ansprechpartner waehrend der Ausfuehrung verfuegbar.",
      "Alle benoetigten Zugriffe, Berechtigungen und Freigaben liegen vor Beginn des Bausteins vor.",
      "Wartungs-, Test- und Cutover-Fenster werden rechtzeitig freigegeben.",
      "Abhaengige Drittteams liefern erforderliche Inputs innerhalb der vereinbarten Fristen."
    ],
    constraints: [
      "Aenderungen ausserhalb des definierten Scopes werden nicht implizit umgesetzt.",
      "Abhaengigkeiten zu Fremdprodukten/Providern koennen Zeitplaene beeinflussen.",
      "Unvorhergesehene Ist-Abweichungen koennen zusaetzliche Analyse oder Re-Planung erfordern."
    ],
    out_of_scope: [
      "Dauerhafte Betriebsverantwortung ohne separaten Ops-/Managed-Service-Baustein.",
      "Implementierung nicht benannter Zusatzprodukte oder paralleler Plattformwechsel.",
      "Umfangreiche Reorganisation angrenzender Architekturdomainen ausserhalb dieses Outcomes."
    ],
    acceptance: [
      "Alle im Baustein definierten Deliverables wurden vollstaendig uebergeben und versioniert.",
      "Mindestens drei abgestimmte Pruef-/Testkriterien wurden erfolgreich durchgefuehrt und dokumentiert.",
      "Offene Punkte, Restrisiken und erforderliche Folgeaktionen wurden schriftlich abgestimmt."
    ],
    scope: {
      description: `Umsetzung des bestellbaren Outcomes "${taskName}" in Phase ${phase.label} fuer ${role.onPrem} nach ${targetName}.`,
      qty,
      boundaries: [
        "Scope ist auf die benannte Rolle/Zielplattform und den konkreten Outcome begrenzt.",
        "Aenderungen am Gesamtprojekt-Scope werden separat bewertet und freigegeben.",
        "Cross-Workload-Abhaengigkeiten werden nur koordiniert, nicht automatisch umgesetzt."
      ]
    },
    effort_drivers: ensureArray(role.effort_drivers).length
      ? role.effort_drivers
      : ["Komplexitaet der Ist-Umgebung", "Anzahl Abhaengigkeiten", "Freigabezyklen", "Migrationsfenster"],
    risks: [
      "Unvollstaendige Bestandsdaten oder nicht dokumentierte Altlasten fuehren zu Zusatzaufwand.",
      "Freigabe- oder Zugriffsblocker verzögern technische Arbeitspakete.",
      "Scope-Aenderungen waehrend der Umsetzung erhoehen Aufwand und Abstimmungsbedarf."
    ],
    mitigations: [
      "Readiness-Check fuer Zugriffe/Freigaben vor Start des Bausteins.",
      "Regelmaessige Review- und Entscheidungsrunden mit transparentem Status.",
      "Dokumentiertes Change-Control mit Re-Estimate bei Scope-Aenderungen."
    ],
    customer_responsibilities: [
      "Bereitstellung zustaendiger Ansprechpartner und Entscheidungswege.",
      "Termingerechte Freigabe von Wartungsfenstern, Zugraengen und Testgruppen.",
      "Review/Abnahme der gelieferten Ergebnisse innerhalb vereinbarter Fristen."
    ],
    provider_responsibilities: [
      "Planung und technische Umsetzung gemaess abgestimmtem Scope.",
      "Nachvollziehbare Dokumentation von Entscheidungen, Risiken und Ergebnissen.",
      "Fruehzeitige Eskalation bei Blockern sowie strukturierte Uebergabe."
    ],
    raci: {
      customer: [
        "Accountable fuer fachliche Priorisierung und Freigaben.",
        "Consulted bei Betriebs-, Prozess- und Compliance-Entscheidungen."
      ],
      provider: [
        "Responsible fuer technische Planung, Ausfuehrung und Nachweisfuehrung.",
        "Consulted fuer Best Practices, Risikosteuerung und Optimierungsoptionen."
      ]
    },
    change_control:
      "Scope-Aenderungen werden ueber ein formales Change-Request-Verfahren aufgenommen, bewertet (Aufwand/Termin/Risiko) und erst nach Freigabe umgesetzt.",
    notes: `On-Prem Migrationsbibliothek: ${role.key}/${target.key}/${phase.folder}.`,
    dependencies: {
      requires,
      excludes
    }
  };
}

function moduleFilePath(role, target, phase, moduleId, taskName) {
  const folder = path.join(OUTPUT_ROOT, role.key, target.key, phase.folder);
  const filename = `${moduleId}__${slugify(taskName)}.json`;
  return { folder, file: path.join(folder, filename) };
}

function buildRoleTargetModules(role, target) {
  const phaseTaskIds = new Map();
  const modules = [];

  PHASES.forEach((phase) => {
    const tasks = TASKS_BY_PHASE[phase.code] || [];
    const ids = tasks.map((_, idx) => {
      const num = String(idx + 1).padStart(3, "0");
      return `LS-OPM-${role.code}-${target.code}-${phase.code}-${num}`;
    });
    phaseTaskIds.set(phase.code, ids);
  });

  PHASES.forEach((phase, phaseIndex) => {
    const tasks = TASKS_BY_PHASE[phase.code] || [];
    tasks.forEach((taskName, taskIndex) => {
      const id = phaseTaskIds.get(phase.code)[taskIndex];
      const requires = [];
      if (phaseIndex > 0) {
        const prevPhase = PHASES[phaseIndex - 1];
        const prevIds = phaseTaskIds.get(prevPhase.code) || [];
        if (prevIds[0]) {
          requires.push(prevIds[0]);
        }
      }
      const samePhaseIds = phaseTaskIds.get(phase.code) || [];
      if (taskIndex > 0 && samePhaseIds[taskIndex - 1]) {
        requires.push(samePhaseIds[taskIndex - 1]);
      }

      const module = buildModule({
        role,
        target,
        phase,
        taskName,
        taskIndex,
        id,
        requires,
        excludes: []
      });

      modules.push({
        ...module,
        __meta: {
          roleKey: role.key,
          targetKey: target.key,
          phaseCode: phase.code,
          taskIndex,
          taskName
        }
      });
    });
  });

  return modules;
}

function applyMutualExcludes(role, perTargetModules) {
  if (!role.mutuallyExclusiveTargets || perTargetModules.length < 2) {
    return;
  }
  const moduleByComposite = new Map();
  perTargetModules.forEach((modules, targetIndex) => {
    modules.forEach((module) => {
      const key = `${module.__meta.phaseCode}::${module.__meta.taskIndex}::${targetIndex}`;
      moduleByComposite.set(key, module);
    });
  });

  for (let i = 0; i < perTargetModules.length; i += 1) {
    for (let j = 0; j < perTargetModules.length; j += 1) {
      if (i === j) continue;
      perTargetModules[i].forEach((module) => {
        const counterpartKey = `${module.__meta.phaseCode}::${module.__meta.taskIndex}::${j}`;
        const counterpart = moduleByComposite.get(counterpartKey);
        if (counterpart) {
          module.dependencies.excludes = Array.from(
            new Set([...(module.dependencies.excludes || []), counterpart.id])
          );
        }
      });
    }
  }
}

function writeModules(modules, role, target) {
  let count = 0;
  modules.forEach((module) => {
    const { folder, file } = moduleFilePath(
      role,
      target,
      PHASES.find((p) => p.code === module.__meta.phaseCode),
      module.id,
      module.__meta.taskName || module.title
    );
    fs.mkdirSync(folder, { recursive: true });
    const payload = { ...module };
    delete payload.__meta;
    fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    count += 1;
  });
  return count;
}

function main() {
  const args = parseArgs();
  if (args.clean) {
    fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  }
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  const selectedRoles = args.roles
    ? ROLES.filter((role) => args.roles.includes(role.key))
    : ROLES;

  if (!selectedRoles.length) {
    throw new Error("Keine gueltigen Rollen fuer die Generierung ausgewaehlt.");
  }

  let total = 0;
  const summary = [];
  selectedRoles.forEach((role) => {
    const perTargetModules = role.targets.map((target) => buildRoleTargetModules(role, target));
    applyMutualExcludes(role, perTargetModules);
    role.targets.forEach((target, index) => {
      const count = writeModules(perTargetModules[index], role, target);
      total += count;
      summary.push(`${role.key}/${target.key}: ${count}`);
    });
  });

  console.log(`[onprem-ls] Rollen: ${selectedRoles.length} | Module: ${total}`);
  summary.forEach((line) => console.log(`[onprem-ls] ${line}`));
}

try {
  main();
} catch (error) {
  console.error(`[onprem-ls] Fehler: ${error.message}`);
  process.exit(1);
}
