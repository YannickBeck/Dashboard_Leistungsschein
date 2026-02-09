const fs = require("fs");
const path = require("path");

const RELEVANT_FILE = path.join(__dirname, "..", "data", "azure-products-relevant.json");
const ROOT_DIR = path.join(__dirname, "..", "data", "leistungsscheine");
const OUTPUT_ROOT = path.join(ROOT_DIR, "_generated");

const DOMAIN_FOLDER = {
  migration: "01_migration",
  storage: "02_storage",
  network: "03_network",
  identity: "04_identity",
  security: "05_security",
  compute: "06_compute",
  databases: "07_databases",
  devops: "08_devops",
  management_governance: "09_management_governance",
  integration: "10_integration",
  monitoring_ops: "11_monitoring_ops",
  backup_dr: "12_backup_dr",
  change_enablement: "13_change_enablement",
  web_apps: "14_web_apps",
  vdi: "15_vdi"
};

const PHASES = [
  {
    key: "assessment",
    label: "Assessment / Readiness",
    requires: [],
    base: { min: 1, likely: 2, max: 3 }
  },
  {
    key: "design",
    label: "Design / Decision Log",
    requires: ["assessment"],
    base: { min: 1, likely: 2, max: 4 }
  },
  {
    key: "build",
    label: "Provisioning / Build",
    requires: ["design"],
    base: { min: 2, likely: 4, max: 7 }
  },
  {
    key: "security",
    label: "Security / Hardening",
    requires: ["build"],
    base: { min: 1, likely: 3, max: 5 }
  },
  {
    key: "integration",
    label: "Integration / Connectivity",
    requires: ["build"],
    base: { min: 1, likely: 3, max: 6 }
  },
  {
    key: "migration",
    label: "Migration / Implementierung",
    requires: ["build"],
    base: { min: 2, likely: 4, max: 8 }
  },
  {
    key: "testing",
    label: "Testing / Abnahme",
    requires: ["migration"],
    base: { min: 1, likely: 2, max: 4 }
  },
  {
    key: "handover",
    label: "Dokumentation / Handover",
    requires: ["testing"],
    base: { min: 1, likely: 2, max: 3 }
  },
  {
    key: "operations",
    label: "Operations Add-on",
    requires: ["handover"],
    base: { min: 1, likely: 3, max: 5 }
  },
  {
    key: "optimization",
    label: "Optimization Add-on",
    requires: ["operations"],
    base: { min: 1, likely: 2, max: 4 }
  }
];

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
    .replace(/\u00A0/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitize(value) {
  return String(value || "")
    .replace(/\u00A0/g, " ")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTheme(product) {
  const fromUrl = (() => {
    try {
      const url = new URL(product.url || "");
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || "";
    } catch (_error) {
      return "";
    }
  })();
  return slugify(fromUrl || product.name || product.category || "produkt");
}

function getNextNumericId() {
  const files = walkJsonFiles(ROOT_DIR, []);
  let max = 1000;
  files.forEach((filePath) => {
    try {
      const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const match = String(json.id || "").match(/^LS-(\d+)$/);
      if (!match) {
        return;
      }
      const value = Number(match[1]);
      if (Number.isFinite(value) && value > max) {
        max = value;
      }
    } catch (_error) {
      // skip invalid files
    }
  });
  return max + 1;
}

function phaseEnabled(product, phaseKey) {
  const text = [product.name, product.category, product.description, ...(product.tags || [])]
    .join(" ")
    .toLowerCase();
  const domain = product.domain_suggestion || "migration";

  if (phaseKey === "integration") {
    return [
      "storage",
      "network",
      "integration",
      "web_apps",
      "compute",
      "databases",
      "identity",
      "backup_dr"
    ].includes(domain);
  }
  if (phaseKey === "migration") {
    return (
      text.includes("migrate") ||
      text.includes("migration") ||
      text.includes("files") ||
      text.includes("database") ||
      text.includes("app") ||
      text.includes("backup") ||
      ["migration", "storage", "databases", "compute", "web_apps", "backup_dr"].includes(domain)
    );
  }
  if (phaseKey === "optimization") {
    return Number(product.score || 0) >= 6;
  }
  return true;
}

function estimateForPhase(base, score) {
  const booster = score >= 10 ? 2 : score >= 7 ? 1 : 0;
  return {
    unit: "PT",
    min: base.min,
    likely: base.likely + booster,
    max: base.max + booster
  };
}

function domainDrivers(domain) {
  const drivers = {
    migration: ["Datenvolumen pro TB", "Anzahl Quellsysteme", "Freeze-/Cutover-Fenster", "Datei- und ACL-Komplexitaet"],
    storage: ["Anzahl Storage Accounts/Shares", "Private Endpoint + DNS Aufwand", "Quota/Performance-Anforderungen", "Backup-Retention"],
    network: ["Anzahl VNets/Subnets", "Firewall-Freigaben", "DNS-Topologie", "S2S/ER Abhaengigkeiten"],
    identity: ["Gruppen-/Rollenmodell", "Hybrid-Identity-Reife", "Anzahl Zugriffsfaelle", "Freigabezyklen"],
    security: ["Policy-/Control-Umfang", "Ausnahmeregeln", "Logging/Retention", "Regulatorische Vorgaben"],
    compute: ["Workload-Anzahl", "Netzwerk- und Security-Integration", "Betriebsfenster", "Automatisierungsreife"],
    databases: ["DB-Anzahl", "Schema-/Datenvolumen", "Downtime-Anforderung", "Anwendungsabhaengigkeiten"],
    devops: ["Anzahl Pipelines", "IaC-Abdeckung", "Freigabeprozess", "Environment-Anzahl"],
    management_governance: ["Subscription-Landschaft", "RBAC-Komplexitaet", "Policy-Dichte", "Reporting-Frequenz"],
    integration: ["Anzahl Schnittstellen", "Auth- und Secret-Handling", "Fehlertoleranz", "Monitoringintegration"],
    monitoring_ops: ["Signalquellen", "Alert-Dichte", "Runbook-Reife", "Servicezeiten"],
    backup_dr: ["Schutzobjekte", "Retention-Vorgaben", "Restore-Szenarien", "Wiederanlaufzeiten"],
    change_enablement: ["Nutzergruppen", "Kommunikationsumfang", "Schulungsbedarf", "Hypercare-Dauer"],
    web_apps: ["App-/Slot-Anzahl", "CI/CD-Reife", "TLS/Netzwerkbedingungen", "Skalierungsprofil"],
    vdi: ["Session-Host-Anzahl", "Profil-/Storage-Anbindung", "User-Lastprofil", "Betriebsmuster"]
  };
  return drivers[domain] || ["Technische Komplexitaet", "Abhaengigkeiten", "Freigabezyklen", "Qualitaet Bestandsdaten"];
}

function scopeQty(domain) {
  const defaults = {
    migration: { tb: 2, shares: 6, users: 120, files_million: 0.35 },
    storage: { tb: 2, shares: 6 },
    network: { users: 120, shares: 6 },
    identity: { users: 120, shares: 6 },
    security: { shares: 6 },
    monitoring_ops: { shares: 6, users: 120 },
    backup_dr: { tb: 2, shares: 6 },
    databases: { users: 40 },
    web_apps: { users: 50 },
    compute: { users: 30 },
    vdi: { users: 120 }
  };
  return defaults[domain] || {};
}

function createList(...items) {
  return items.map((item) => sanitize(item)).filter(Boolean);
}

function buildModule({ id, product, domain, theme, phase, phaseIdMap }) {
  const productName = sanitize(product.name || "Azure Produkt");
  const category = sanitize(product.category || "Unkategorisiert");
  const phaseLabel = sanitize(phase.label);
  const estimate = estimateForPhase(phase.base, Number(product.score || 0));
  const requires = (phase.requires || []).map((phaseKey) => phaseIdMap.get(phaseKey)).filter(Boolean);

  const tags = Array.from(
    new Set(
      createList(
        "Azure",
        productName,
        category,
        domain,
        phaseLabel,
        ...(Array.isArray(product.tags) ? product.tags : [])
      )
    )
  );

  return {
    schema_version: "1.1.0",
    id,
    title: `${productName} - ${phaseLabel}`,
    domain,
    theme,
    summary: `${phaseLabel} fuer ${productName} mit klar abgrenzbarem, separat beauftragbarem Ergebnis.`,
    tags,
    source: {
      type: "generated",
      origin: "azure-products-index",
      url: product.url || ""
    },
    estimate,
    intro: `${phaseLabel} fuer ${productName} wird als eigenstaendiger Leistungsbaustein umgesetzt. Der Fokus liegt auf einem klar messbaren Teilergebnis, das separat beauftragt und abgenommen werden kann. Ergebnis sind technische Nachweise, Entscheidungsgrundlagen und dokumentierte Restpunkte.`,
    services: createList(
      `Input-Aufnahme fuer ${productName}: Randbedingungen, Ziele und Erfolgskriterien abstimmen.`,
      "Ist-Analyse der relevanten technischen Voraussetzungen und Abhaengigkeiten.",
      `${phaseLabel} planen: Reihenfolge, Entscheidungslogik und Pruefpunkte festlegen.`,
      "Technische Umsetzung im vereinbarten Scope mit nachvollziehbaren Konfigurationsschritten.",
      "Validierung mit definierten Tests/Checks und dokumentierten Ergebnissen.",
      "Review, Uebergabe und Abstimmung der naechsten Schritte inkl. Restpunkte."
    ),
    deliverables: createList(
      `${phaseLabel}-Arbeitsdokument fuer ${productName}.`,
      "Konfigurations- und Parameternachweis.",
      "Test-/Pruefprotokoll inkl. Ergebnisstatus.",
      "Abnahme- und Uebergabeprotokoll.",
      "Risiko-/Massnahmenliste inkl. Verantwortlichkeiten."
    ),
    assumptions: createList(
      "Kundenseitige Ansprechpartner stehen fuer Rueckfragen und Entscheidungen zeitnah bereit.",
      "Benoetigte Zugriffe, Berechtigungen und Freigaben liegen vor Start vor.",
      "Abhaengige Teams liefern Inputs/Freigaben innerhalb vereinbarter Fristen.",
      "Testfenster und Pilotnutzer sind fuer Validierung verfuegbar."
    ),
    constraints: createList(
      "Aenderungen ausserhalb des vereinbarten Scopes werden separat bewertet.",
      "Abhaengigkeiten zu Drittplattformen/Providern koennen Durchlaufzeiten beeinflussen.",
      "Nicht reproduzierbare Fehler ausserhalb des Testfensters koennen Zusatzanalyse erfordern."
    ),
    out_of_scope: createList(
      "Dauerhafte Betriebsfuehrung ausserhalb separat gebuchter Betriebsbausteine.",
      "Leistungen fuer nicht benannte Produkte/Workloads.",
      "Groessere Architektur-Neuplanungen ausserhalb dieses konkreten Outcomes."
    ),
    acceptance: createList(
      "Alle definierten Deliverables sind uebergeben und versioniert dokumentiert.",
      "Mindestens drei abgestimmte Funktions-/Integrationschecks sind erfolgreich protokolliert.",
      "Offene Punkte und Restrisiken sind mit Verantwortlichkeiten dokumentiert und abgestimmt."
    ),
    scope: {
      description: `Umsetzung von ${phaseLabel} fuer ${productName} im abgestimmten Umfang mit klaren Liefergrenzen.`,
      qty: scopeQty(domain),
      boundaries: createList(
        "Leistungsumfang ist auf den benannten Produktbereich beschraenkt.",
        "Aenderungen an uebergeordneten Architekturzielen sind nicht enthalten.",
        "Zusatzanforderungen werden ueber Change-Control geplant."
      )
    },
    effort_drivers: domainDrivers(domain),
    risks: createList(
      "Unvollstaendige Bestandsinformationen fuehren zu Nacharbeit.",
      "Fehlende Freigaben blockieren technische Umsetzungsschritte.",
      "Scope-Aenderungen waehrend der Umsetzung erhoehen Aufwand und Laufzeit."
    ),
    mitigations: createList(
      "Frueher Readiness-Check fuer Zugriffe, Freigaben und Testdaten.",
      "Regelmaessige Entscheidungsrunden mit dokumentierten To-dos.",
      "Formalisierte Change-Bewertung mit transparentem Impact."
    ),
    customer_responsibilities: createList(
      "Benennung fachlicher/technischer Ansprechpartner.",
      "Bereitstellung von Zugraengen und Freigaben gemaess Plan.",
      "Teilnahme an Reviews, Tests und Abnahme."
    ),
    provider_responsibilities: createList(
      "Durchfuehrung der vereinbarten technischen Leistungen.",
      "Transparente Dokumentation von Risiken, Entscheidungen und Restpunkten.",
      "Nachvollziehbare Ergebnisuebergabe inklusive Abnahmeunterstuetzung."
    ),
    raci: {
      customer: createList(
        "Accountable fuer fachliche Freigaben und Priorisierung.",
        "Consulted fuer Prozess- und Betriebsentscheidungen."
      ),
      provider: createList(
        "Responsible fuer technische Planung/Umsetzung.",
        "Consulted fuer Best Practices und Risikosteuerung."
      )
    },
    change_control:
      "Aenderungen am Scope werden ueber ein dokumentiertes Change-Control mit Aufwand-/Termin-Impact bewertet und nach Freigabe umgesetzt.",
    notes: `Automatisch generierter, granularer Baustein aus Azure-Produktindex (${new Date().toISOString().slice(0, 10)}).`,
    dependencies: {
      requires,
      excludes: []
    }
  };
}

function main() {
  if (!fs.existsSync(RELEVANT_FILE)) {
    throw new Error(`Relevant file fehlt: ${RELEVANT_FILE}`);
  }
  const relevant = JSON.parse(fs.readFileSync(RELEVANT_FILE, "utf8"));
  const products = Array.isArray(relevant.products) ? relevant.products : [];
  if (!products.length) {
    throw new Error("Keine relevanten Produkte zum Generieren vorhanden.");
  }

  fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  let nextId = getNextNumericId();
  let generatedCount = 0;

  products.forEach((product) => {
    const domain = DOMAIN_FOLDER[product.domain_suggestion]
      ? product.domain_suggestion
      : "migration";
    const folder = DOMAIN_FOLDER[domain];
    const theme = normalizeTheme(product);
    const productSlug = slugify(product.name || theme);
    const targetDir = path.join(OUTPUT_ROOT, folder, theme);
    fs.mkdirSync(targetDir, { recursive: true });

    const activePhases = PHASES.filter((phase) => phaseEnabled(product, phase.key));
    const phaseIdMap = new Map();
    activePhases.forEach((phase) => {
      const id = `LS-${String(nextId).padStart(4, "0")}`;
      nextId += 1;
      phaseIdMap.set(phase.key, id);
    });

    activePhases.forEach((phase) => {
      const id = phaseIdMap.get(phase.key);
      const module = buildModule({
        id,
        product,
        domain,
        theme,
        phase,
        phaseIdMap
      });
      const fileName = `${module.id}__${productSlug}-${phase.key}.json`;
      fs.writeFileSync(path.join(targetDir, fileName), `${JSON.stringify(module, null, 2)}\n`, "utf8");
      generatedCount += 1;
    });
  });

  console.log(
    `[generator] Produkte: ${products.length} | generierte Leistungsscheine: ${generatedCount} | output: ${OUTPUT_ROOT}`
  );
}

try {
  main();
} catch (error) {
  console.error(`[generator] Fehler: ${error.message}`);
  process.exit(1);
}
