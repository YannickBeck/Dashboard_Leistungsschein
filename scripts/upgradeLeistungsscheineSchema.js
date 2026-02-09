const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..", "data", "leistungsscheine");

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

function asArray(value) {
  return Array.isArray(value) ? value.filter((item) => String(item || "").trim()) : [];
}

function defaultDrivers(domain) {
  const map = {
    migration: ["Datenvolumen pro TB", "Anzahl Shares/Quellen", "ACL-Komplexitaet"],
    storage: ["Anzahl Storage Accounts", "Anzahl Shares", "Private Endpoint/DNS-Komplexitaet"],
    network: ["Anzahl VNets/Subnets", "DNS-Zonenstruktur", "Firewall-/Routing-Freigaben"],
    identity: ["Anzahl Gruppen und ACL-Eintraege", "Hybrid-Identity-Reifegrad", "Testnutzer-Sets"],
    security: ["Policy-Anzahl", "Ausnahmeregelungen", "Vorhandene Security-Baseline"],
    compute: ["Anzahl Workloads", "Netzwerkintegration", "Betriebszeitfenster"],
    databases: ["Anzahl DB-Instanzen", "Schema-/Datenvolumen", "Downtime-Fenster"],
    devops: ["Anzahl Deployments", "IaC-Reifegrad", "Review- und Freigabeschritte"],
    management_governance: ["Anzahl Subscriptions", "RBAC-Rollenmodell", "Policy-Durchdringung"],
    integration: ["Anzahl Schnittstellen", "Authentifizierungsmuster", "Fehlertoleranz/Retry-Strategien"],
    monitoring_ops: ["Anzahl Signalquellen", "Anzahl Alerts", "Runbook-Reifegrad"],
    backup_dr: ["Retention-Anforderungen", "Anzahl Schutzobjekte", "Restore-Testumfang"],
    change_enablement: ["Anzahl Nutzergruppen", "Kommunikationskanalanzahl", "Hypercare-Dauer"],
    web_apps: ["Anzahl Apps/Slots", "CI/CD-Reifegrad", "TLS/Netzwerkanforderungen"],
    vdi: ["Anzahl Session Hosts", "User-Pools", "Profil-/Storage-Anbindung"]
  };
  return map[domain] || ["Komplexitaet der Umgebung", "Abhaengigkeiten zu Drittsystemen", "Freigabezyklen"];
}

function ensureIntro(value, title) {
  const intro = String(value || "").trim();
  if (intro) {
    return intro;
  }
  return `Dieser Leistungsschein beschreibt einen klar abgegrenzten Arbeitsumfang fuer ${title}. Ergebnis ist ein pruefbares Teilergebnis inklusive dokumentierter Annahmen und Abgrenzungen.`;
}

function ensureScope(json) {
  const scope = json.scope && typeof json.scope === "object" ? json.scope : {};
  const description =
    String(scope.description || "").trim() ||
    `Umsetzung des Bausteins ${json.id} (${json.title}) im abgestimmten Projektkontext.`;
  const qty = scope.qty && typeof scope.qty === "object" ? scope.qty : {};
  const boundaries = asArray(scope.boundaries);
  if (boundaries.length === 0) {
    boundaries.push(
      "Aenderungen ausserhalb dieses Leistungsscheins werden ueber Change-Control behandelt.",
      "Projektuebergreifende Architekturentscheidungen sind nicht automatisch enthalten."
    );
  }
  return { description, qty, boundaries };
}

function ensureDependencies(json) {
  const deps = json.dependencies && typeof json.dependencies === "object" ? json.dependencies : {};
  return {
    requires: asArray(deps.requires),
    excludes: asArray(deps.excludes)
  };
}

function enrichBase(json) {
  const title = String(json.title || "Leistungsschein").trim();
  json.schema_version = "1.1.0";
  json.summary = String(json.summary || `${title} als eigenstaendiger Angebotsbaustein.`).trim();
  json.intro = ensureIntro(json.intro, title);
  json.services = asArray(json.services);
  json.deliverables = asArray(json.deliverables);
  json.assumptions = asArray(json.assumptions);
  json.constraints = asArray(json.constraints);
  json.out_of_scope = asArray(json.out_of_scope);
  json.acceptance = asArray(json.acceptance);
  if (json.services.length === 0) {
    json.services = [
      "Kickoff und Inputaufnahme fuer den Baustein",
      "Durchfuehrung der technischen Kernaktivitaet",
      "Ergebnisreview und dokumentierte Uebergabe"
    ];
  }
  if (json.deliverables.length === 0) {
    json.deliverables = ["Ergebnisdokument", "Konfigurationsnachweis", "Offene-Punkte-Liste"];
  }
  if (json.assumptions.length === 0) {
    json.assumptions = [
      "Kundenseitig stehen Ansprechpartner fuer Rueckfragen bereit.",
      "Zugaenge und Freigaben werden termingerecht bereitgestellt.",
      "Entscheidungspunkte werden innerhalb vereinbarter Fristen geklaert."
    ];
  }
  if (json.constraints.length === 0) {
    json.constraints = [
      "Abhaengigkeiten zu Drittsystemen koennen den Ablauf beeinflussen.",
      "Aenderungen ausserhalb des vereinbarten Scopes werden separat geplant."
    ];
  }
  if (json.out_of_scope.length === 0) {
    json.out_of_scope = [
      "Dauerhafte Betriebsfuehrung ohne separate Vereinbarung.",
      "Implementierungen ausserhalb des definierten Systembereichs.",
      "Produktiv-Rollout ausserhalb abgestimmter Zeitfenster."
    ];
  }
  if (json.acceptance.length === 0) {
    json.acceptance = [
      "Liefergegenstaende sind vollstaendig uebergeben.",
      "Abgestimmte Pruefpunkte sind nachvollziehbar erfuellt.",
      "Offene Punkte sind dokumentiert und priorisiert."
    ];
  }

  json.scope = ensureScope(json);
  json.effort_drivers = asArray(json.effort_drivers);
  if (json.effort_drivers.length === 0) {
    json.effort_drivers = defaultDrivers(String(json.domain || "").trim());
  }
  json.risks = asArray(json.risks);
  if (json.risks.length === 0) {
    json.risks = [
      "Spaete Freigaben oder fehlende Berechtigungen verschieben Arbeitspakete.",
      "Unerwartete Ist-Abweichungen erhoehen den Aufwand."
    ];
  }
  json.mitigations = asArray(json.mitigations);
  if (json.mitigations.length === 0) {
    json.mitigations = [
      "Fruehe Zugriffspruefung und abgestimmte Freigabeplanung.",
      "Regelmaessige Scope-Reviews mit dokumentierten Entscheidungen."
    ];
  }

  json.customer_responsibilities = asArray(json.customer_responsibilities);
  if (json.customer_responsibilities.length === 0) {
    json.customer_responsibilities = [
      "Bereitstellung technischer Ansprechpartner.",
      "Freigabe der benoetigten Wartungs- und Testfenster.",
      "Rueckmeldung zu offenen Punkten innerhalb vereinbarter Fristen."
    ];
  }
  json.provider_responsibilities = asArray(json.provider_responsibilities);
  if (json.provider_responsibilities.length === 0) {
    json.provider_responsibilities = [
      "Planung, Durchfuehrung und Dokumentation der vereinbarten Leistungen.",
      "Risikotransparenz und aktive Eskalation bei Blockern.",
      "Uebergabe nachvollziehbarer Ergebnisse fuer Review/Abnahme."
    ];
  }

  const raci = json.raci && typeof json.raci === "object" ? json.raci : {};
  json.raci = {
    customer: asArray(raci.customer).length
      ? asArray(raci.customer)
      : ["Accountable fuer fachliche Entscheidungen", "Responsible fuer Freigaben/Zugaenge"],
    provider: asArray(raci.provider).length
      ? asArray(raci.provider)
      : ["Responsible fuer technische Umsetzung", "Consulted fuer Architektur- und Betriebsfragen"]
  };

  json.change_control =
    String(json.change_control || "").trim() ||
    "Scope- oder Annahmenaenderungen werden ueber ein dokumentiertes Change-Verfahren bewertet, abgeschaetzt und separat freigegeben.";
  if (json.notes !== undefined && json.notes !== null) {
    json.notes = String(json.notes);
  }
  json.dependencies = ensureDependencies(json);
}

function main() {
  const files = walkJsonFiles(ROOT_DIR, []);
  if (files.length === 0) {
    throw new Error("Keine JSON-Dateien gefunden.");
  }

  let updated = 0;
  files.forEach((filePath) => {
    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    enrichBase(json);
    fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
    updated += 1;
  });

  console.log(`[upgrade] Aktualisiert: ${updated} Dateien`);
}

try {
  main();
} catch (error) {
  console.error(`[upgrade] Fehler: ${error.message}`);
  process.exit(1);
}
