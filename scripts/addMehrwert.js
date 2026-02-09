const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..", "data", "leistungsscheine");
const REPORT_FILE = path.join(__dirname, "..", "docs", "mehrwert-report.md");
const PROJECT_ROOT = path.join(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE_REGENERATE = process.argv.includes("--force");
const LEGACY_FIELDS = [
  "value",
  "benefits",
  "benefit",
  "business_value",
  "nutzen",
  "value_proposition",
  "mehrwerte",
];

const CATEGORY_PATTERNS = {
  backup_dr: [
    /\bbackup\b/i,
    /\brestore\b/i,
    /\brpo\b/i,
    /\brto\b/i,
    /\bdisaster\b/i,
    /\bdr\b/i,
    /\brecovery\b/i,
    /\bretention\b/i,
    /\basr\b/i,
  ],
  security: [
    /\bsecurity\b/i,
    /\bwaf\b/i,
    /\bdefender\b/i,
    /\bsentinel\b/i,
    /\bhardening\b/i,
    /\bleast\s*privilege\b/i,
    /\bcompliance\b/i,
    /\bkey\s*vault\b/i,
    /\bzero\s*trust\b/i,
  ],
  monitoring: [
    /\bmonitoring\b/i,
    /\bmonitor\b/i,
    /\balert\b/i,
    /\bobservability\b/i,
    /\blog analytics\b/i,
    /\bworkspace\b/i,
    /\bincident\b/i,
    /\beskalation\b/i,
    /\brunbook\b/i,
    /\bmttr\b/i,
  ],
  migration: [
    /\bmigration\b/i,
    /\bcutover\b/i,
    /\bdecommission\b/i,
    /\bpre-stage\b/i,
    /\bdelta\b/i,
    /\bbackout\b/i,
    /\bwave\b/i,
    /\brollout\b/i,
    /\bumzug\b/i,
  ],
  networking: [
    /\bnetwork\b/i,
    /\bnetzwerk\b/i,
    /\bdns\b/i,
    /\bvnet\b/i,
    /\bsubnet\b/i,
    /\brouting\b/i,
    /\bprivate endpoint\b/i,
    /\bprivate link\b/i,
    /\bgateway\b/i,
    /\bfirewall\b/i,
    /\bresolver\b/i,
  ],
  identity: [
    /\bidentity\b/i,
    /\bentra\b/i,
    /\bactive directory\b/i,
    /\bad\b/i,
    /\bacl\b/i,
    /\brbac\b/i,
    /\bsso\b/i,
    /\bauth\b/i,
    /\bntfs\b/i,
  ],
  change_enablement: [
    /\bchange\b/i,
    /\benablement\b/i,
    /\bschulung\b/i,
    /\btraining\b/i,
    /\bpilot\b/i,
    /\bhypercare\b/i,
    /\bkommunikation\b/i,
    /\badoption\b/i,
    /\bknowledge transfer\b/i,
  ],
  governance_finops: [
    /\bgovernance\b/i,
    /\bfinops\b/i,
    /\bcost\b/i,
    /\bkosten\b/i,
    /\blanding zone\b/i,
    /\bguardrail\b/i,
    /\bpolicy\b/i,
    /\bcmdb\b/i,
    /\btagging\b/i,
  ],
  data_platform: [
    /\bsql\b/i,
    /\bdatabase\b/i,
    /\bdata\b/i,
    /\bschema\b/i,
    /\bquery\b/i,
    /\bazure sql\b/i,
    /\bmanaged instance\b/i,
  ],
  integration: [
    /\bintegration\b/i,
    /\bapi\b/i,
    /\blogic app\b/i,
    /\bservice bus\b/i,
    /\bevent grid\b/i,
    /\bapim\b/i,
    /\bsftp\b/i,
    /\bworkflow\b/i,
    /\bmessaging\b/i,
  ],
  apps_compute: [
    /\bapp service\b/i,
    /\bazure functions\b/i,
    /\bfunctions\b/i,
    /\bweb app\b/i,
    /\bvdi\b/i,
    /\bvirtual desktop\b/i,
    /\bavd\b/i,
    /\bteams phone\b/i,
  ],
};

const CATEGORY_TEMPLATES = {
  backup_dr: {
    business:
      "Backup- und Wiederherstellungsprozesse werden als planbarer Betriebsprozess mit klaren Verantwortlichkeiten umgesetzt, nicht als seltene Einzelaktivitaet.",
    status:
      "Gegenueber dem Status quo ohne regelmaessig gepruefte Restore-Pfade steigt die Verlaesslichkeit bei Wiederanlauf und Datenrueckholung deutlich.",
    risk:
      "Das reduziert Risiken aus Datenverlust, verfehlten RPO/RTO-Zielen und langwierigen Eskalationen im Ernstfall.",
    outcome:
      "Dokumentierte Nachweise fuer Schutzstatus, Retention und Wiederherstellbarkeit verbessern Auditfaehigkeit und Management-Entscheidungen.",
  },
  security: {
    business:
      "Sicherheitskontrollen werden im Zielbetrieb verankert, damit Schutzwirkung und Betriebsfaehigkeit gemeinsam geplant und nicht gegeneinander ausgespielt werden.",
    status:
      "Gegenueber punktuellen Einzelhaertungen entsteht ein konsistentes Sicherheitsniveau ueber Rollen, Konfiguration und Prozessschnittstellen.",
    risk:
      "Das reduziert Risiken aus Fehlkonfigurationen, unautorisierten Zugriffen und aufwendigen Nacharbeiten bei Audits oder Incidents.",
    outcome:
      "Klare Sicherheitsnachweise und Entscheidungsgrundlagen verkuerzen Freigaben und stabilisieren den Regelbetrieb.",
  },
  monitoring: {
    business:
      "Monitoring und Alerting werden als steuerbarer Betriebsprozess aufgesetzt, sodass Stoerungen frueh sichtbar und priorisiert bearbeitbar sind.",
    status:
      "Gegenueber reaktiver Fehlersuche ohne einheitliche Signale sinken Suchzeiten und Medienbrueche zwischen Fachbereich, Betrieb und Support.",
    risk:
      "Das reduziert Risiken aus spaeter Fehlererkennung, ungeplanten Ausfaellen und langen Wiederherstellungszeiten.",
    outcome:
      "Eindeutige Alarmwege, Schwellenwerte und Runbooks machen Incident-Bearbeitung messbar und wiederholbar.",
  },
  migration: {
    business:
      "Die Migration wird in nachvollziehbare Arbeitspakete mit Abnahmepunkten gegliedert, damit Aufwand, Zeitfenster und Abhaengigkeiten steuerbar bleiben.",
    status:
      "Im Vergleich zu ad-hoc Umstellungen ohne belastbares Runbook sinken Nacharbeiten, weil Reihenfolge und Verantwortlichkeiten vorab geklaert sind.",
    risk:
      "Das reduziert Risiken aus Downtime, inkonsistenten Datenstaenden und ungeplanten Rueckfallmassnahmen im Cutover.",
    outcome:
      "Transparente Restpunkte und Entscheidungslogs beschleunigen Folgewellen und vermeiden wiederkehrende Abstimmungsschleifen.",
  },
  networking: {
    business:
      "Netzwerk-, DNS- und Zugriffspfade werden als Ende-zu-Ende-Strecke gestaltet, damit Anwendungen stabil erreichbar und betrieblich handhabbar bleiben.",
    status:
      "Gegenueber historisch gewachsenen Ausnahmen entsteht eine klare, dokumentierte Konnektivitaetsarchitektur mit reproduzierbaren Freigaben.",
    risk:
      "Das reduziert Risiken aus Namensaufloesungsfehlern, Routing-Problemen und unbeabsichtigter Exposition kritischer Dienste.",
    outcome:
      "Testbare Verbindungs- und Betriebsnachweise verkuerzen Ursachenanalyse und Change-Freigaben.",
  },
  identity: {
    business:
      "Identitaets- und Zugriffssteuerung wird konsistent ueber Rollen, Gruppen und technische Zielsysteme umgesetzt, statt als Einzelfallpflege betrieben.",
    status:
      "Gegenueber lokalen Sonderrechten und uneinheitlichen Berechtigungsmodellen verbessert sich Nachvollziehbarkeit fuer Betrieb, Revision und Fachbereiche.",
    risk:
      "Das reduziert Risiken aus ueberprivilegierten Konten, Berechtigungsfehlern und zeitaufwendigen Entstoerungen bei Zugriffsproblemen.",
    outcome:
      "Klare Verantwortlichkeiten und dokumentierte Zugriffspfade beschleunigen Onboarding, Changes und Audit-Anfragen.",
  },
  change_enablement: {
    business:
      "Kommunikation, Schulung und Uebergabe werden aktiv gesteuert, damit neue Betriebsprozesse schneller akzeptiert und korrekt genutzt werden.",
    status:
      "Gegenueber rein technischer Einfuehrung ohne Enablement sinken Rueckfragen, Medienbrueche und Nachsteuerungsaufwaende nach Go-Live.",
    risk:
      "Das reduziert Risiken aus Bedienfehlern, Ticketspitzen und Produktivitaetseinbussen in der Einfuehrungsphase.",
    outcome:
      "Praxisnahe Leitfaeden und abgestimmte Eskalationswege stabilisieren den Regelbetrieb fruehzeitig.",
  },
  governance_finops: {
    business:
      "Governance und Kostensteuerung werden als laufender Steuerungsmechanismus etabliert, nicht erst nachgelagert bei Budgetabweichungen.",
    status:
      "Gegenueber unkoordiniertem Ressourcenwachstum verbessern sich Transparenz, Priorisierung und wirtschaftliche Steuerbarkeit der Plattform.",
    risk:
      "Das reduziert Risiken aus Compliance-Luecken, ungeplanten Kostenanstiegen und spaeten Korrekturprojekten.",
    outcome:
      "Verbindliche Leitplanken machen Architekturentscheidungen schneller und konsistenter ueber Teams hinweg.",
  },
  data_platform: {
    business:
      "Datenbank- und Datenplattformbausteine schaffen eine belastbare Grundlage fuer stabile Fachprozesse und planbaren Betrieb.",
    status:
      "Gegenueber gewachsener Einzellogik ohne klare Zielarchitektur verbessern sich Performance, Betriebsaufwand und Entscheidbarkeit bei Aenderungen.",
    risk:
      "Das reduziert Risiken aus Dateninkonsistenzen, ungeplanten Laufzeitspitzen und stoerenden Release-Nebenwirkungen.",
    outcome:
      "Messbare Konfigurationen und Testnachweise ermoeglichen belastbare Freigaben fuer produktive Lasten.",
  },
  integration: {
    business:
      "Schnittstellen werden mit klaren Datenflussen, Fehlerpfaden und Verantwortlichkeiten umgesetzt, sodass Prozesse robuster und wartbarer laufen.",
    status:
      "Gegenueber direkter Punkt-zu-Punkt-Kopplung sinken Abhaengigkeiten, weil Integrationslogik entkoppelt und nachvollziehbar betrieben wird.",
    risk:
      "Das reduziert Risiken aus Kettenfehlern, Nachrichtenverlust und intransparenten Wiederanlaufverfahren.",
    outcome:
      "Standardisierte Integrationsmuster beschleunigen Aenderungen und verkleinern das Ausfallfenster bei Releases.",
  },
  apps_compute: {
    business:
      "Anwendungs- und Laufzeitplattformen werden mit klaren Betriebsgrenzen umgesetzt, damit Teams schneller liefern koennen ohne den Betrieb zu destabilisieren.",
    status:
      "Gegenueber eigenbetriebenen Einzelloesungen verbessert sich die Trennung von Entwicklungsaufgaben und Basisbetrieb deutlich.",
    risk:
      "Das reduziert Risiken aus unklaren Deployment-Pfaden, Kapazitaetsengpaessen und langen Wiederherstellungszeiten.",
    outcome:
      "Wiederholbare Bereitstellung und Betriebsnachweise schaffen planbare Releases mit weniger Nacharbeiten.",
  },
  default: {
    business:
      "Der Baustein schafft ein klar abgegrenztes, pruefbares Ergebnis und macht den Projektfortschritt fuer Fachbereich und Betrieb belastbar steuerbar.",
    status:
      "Gegenueber dem Status quo ohne standardisierte Umsetzung sinken Abstimmungsaufwand und Interpretationsspielraeume in der Durchfuehrung.",
    risk:
      "Das reduziert Risiken aus ungeklaerten Abhaengigkeiten, Terminverschiebungen und spaeter Nacharbeit.",
    outcome:
      "Dokumentierte Ergebnisse und klare Verantwortlichkeiten beschleunigen Freigaben sowie Folgeentscheidungen.",
  },
};

const PHASE_PATTERNS = [
  ["cutover", /\bcutover\b|\bgo-live\b|\bproduktiv\b/i],
  ["testing", /\btesting\b|\bfunktionstest\b|\buat\b|\bpilot\b/i],
  ["handover", /\bhandover\b|\buebergabe\b|\bknowledge transfer\b/i],
  ["ops", /\bops\b|\bregelbetrieb\b|\bincident\b|\balerting\b/i],
  ["optimization", /\boptimization\b|\boptimierung\b|\btuning\b|\bfinops\b/i],
  ["change", /\bchange\b|\benablement\b|\bschulung\b|\bkommunikation\b|\bhypercare\b/i],
  ["build", /\bbuild\b|\bbereitstellung\b|\bprovisioning\b|\bplattform\b/i],
  ["design", /\bdesign\b|\bzielarchitektur\b|\bentscheidungslog\b/i],
  ["migration", /\bmigration\b|\bpre-stage\b|\bdelta\b/i],
  ["assessment", /\bassessment\b|\breadiness\b|\binventarisierung\b|\bist-analyse\b/],
];

const PHASE_BULLETS = {
  assessment:
    "Die Assessment-Sicht priorisiert Umsetzungsoptionen fruehzeitig und vermeidet Fehlinvestitionen in unklare technische Richtungen.",
  design:
    "Ein belastbares Design mit dokumentierten Entscheidungen verhindert spaete Architekturwechsel und ungeplante Re-Implementierungen.",
  build:
    "Der Build-Abschnitt stellt reproduzierbare Konfigurationsstaende bereit, was spaetere Betriebsuebernahmen deutlich vereinfacht.",
  migration:
    "Schrittweise Migrationsdurchlaeufe mit klaren Pruefpunkten halten den Betrieb auch waehrend Umstellungen kontrollierbar.",
  cutover:
    "Ein sauber vorbereitetes Cutover-Fenster ermoeglicht geordnetes Umschalten und reduziert Last-Minute-Entscheidungen unter Zeitdruck.",
  testing:
    "Verbindliche Testevidenz vor Freigabe reduziert spaete Produktionsfehler und schafft Transparenz fuer Abnahmeentscheidungen.",
  handover:
    "Strukturierte Uebergabe mit Runbook und Restpunktelogik sichert Wissenstransfer und verkuerzt die Einregelungsphase im Betrieb.",
  ops:
    "Klare Betriebs- und Eskalationsprozesse senken die Zeit bis zur wirksamen Gegenmassnahme bei Stoerungen.",
  optimization:
    "Messbasierte Optimierung verbindet Kosten, Performance und Stabilitaet und verhindert isolierte Einzelmassnahmen ohne Gesamtwirkung.",
  change:
    "Gezielte Begleitung der Anwender reduziert Reibungsverluste nach Inbetriebnahme und stabilisiert neue Arbeitsablaeufe schneller.",
};

const PRODUCT_BULLETS = [
  [/azure files|\bfileserver\b|\bsmb\b/i, "Azure Files ermoeglicht SMB-kompatible Freigaben als Managed-Service; gegenueber eigenbetriebenen Fileservern sinken Patch- und Basisbetriebsaufwaende."],
  [/sharepoint/i, "SharePoint adressiert Zusammenarbeit und Versionierung strukturiert; gegenueber klassischen Laufwerksfreigaben sinken Dubletten und Konflikte bei gleichzeitiger Bearbeitung."],
  [/private endpoint|private link/i, "Private Endpoints verlagern den Zugriff auf interne Netze; gegenueber Public Endpoints sinkt die Exposition und der Aufwand fuer Ausnahmeregeln."],
  [/application gateway \(waf\)|application gateway waf|app gateway waf/i, "Application Gateway WAF bietet zentrale Layer-7-Schutzregeln als Managed-Service; gegenueber selbst betriebenen Proxy-VMs sinken Patch- und Signaturpflege."],
  [/front door waf|azure front door/i, "Azure Front Door WAF kombiniert globales Routing und WAF-Policies zentral; gegenueber verteilten Einzelproxys werden Rollouts und Betrieb konsistenter."],
  [/defender for storage|defender/i, "Defender liefert verwertbare Sicherheitsereignisse direkt an der Plattform; gegenueber rein periodischen Kontrollen wird die Reaktion auf Bedrohungen frueher moeglich."],
  [/\bsentinel\b/i, "Sentinel buendelt Erkennung und Korrelation zentral; gegenueber isolierten Log-Silos verkuerzt sich der Weg zur belastbaren Incident-Bewertung."],
  [/azure backup/i, "Azure Backup macht Schutzstatus und Retention zentral nachvollziehbar; gegenueber manuellen Sicherungsskripten sinkt das Risiko unbeobachteter Sicherungsluecken."],
  [/site recovery|\basr\b/i, "Azure Site Recovery standardisiert Replikation und Failover-Tests; gegenueber rein dokumentierten DR-Plaenen steigt die reale Wiederanlaufbarkeit."],
  [/azure sql managed instance|azuresqlmi|sql managed instance/i, "Azure SQL Managed Instance reduziert Plattformbetrieb fuer Patching, Hochverfuegbarkeit und Basiswartung gegenueber eigener SQL-VM-Infrastruktur."],
  [/azure sql database|azuresqldb/i, "Azure SQL Database liefert gemanagte Verfuegbarkeits- und Sicherheitsgrundlagen; gegenueber Self-Managed-Datenbanken sinkt operativer Basisaufwand."],
  [/\bapp service\b/i, "App Service entkoppelt Anwendungsauslieferung vom Serverbetrieb; gegenueber IaaS-Hosting reduziert sich der Aufwand fuer OS- und Webserver-Basisbetrieb."],
  [/azure functions|\bfunctions\b/i, "Azure Functions passt zu ereignisgetriebenen Lastprofilen; gegenueber dauerhaft laufenden Diensten wird Kapazitaet bedarfsgerechter bereitgestellt."],
  [/api management|\bapim\b/i, "API Management vereinheitlicht Zugriff, Schutz und Versionierung von Schnittstellen; gegenueber direkten Punkt-zu-Punkt-Integrationen sinken Betriebs- und Governance-Aufwaende."],
  [/service bus|event grid/i, "Service Bus und Event Grid entkoppeln Producer und Consumer; gegenueber synchronen Direktaufrufen sinkt die Stoeranfaelligkeit bei Lastspitzen."],
  [/\bkey vault\b|keyvault/i, "Key Vault zentralisiert Geheimnisse und Zertifikate; gegenueber verteilter Ablage sinkt das Risiko veralteter oder offengelegter Zugangsdaten."],
  [/\bintune\b/i, "Intune standardisiert Richtlinien- und Compliance-Pruefungen auf Endgeraeten; gegenueber manueller Verwaltung sinken Abweichungen und Supportaufwaende."],
  [/teams phone/i, "Teams Phone konsolidiert Telefonie in bestehende M365-Betriebsprozesse; gegenueber getrennter PBX sinken Schnittstellenaufwand und Medienbrueche."],
  [/communication services email|acs email/i, "Azure Communication Services Email bietet eine steuerbare Plattform fuer transaktionale und bulk-nahe E-Mail-Fluesse; gegenueber lokalem SMTP-Relay sinken Infrastrukturabhaengigkeiten."],
  [/virtual desktop|\bavd\b/i, "Azure Virtual Desktop skaliert Session-Hosts bedarfsgerecht; gegenueber statischen VDI-Farmen wird Kapazitaet flexibler und transparenter steuerbar."],
  [/dns private resolver|private resolver/i, "Azure DNS Private Resolver zentralisiert hybride Namensaufloesung; gegenueber verteilten DNS-Forwardern sinken Betriebs- und Fehlerrisiken."],
  [/\blogic apps?\b/i, "Logic Apps setzen Integrationsfluesse standardisiert und nachvollziehbar um; gegenueber Individuallogik sinken Wartungs- und Betriebsrisiken."],
];

const STATUS_MARKERS = [/gegenueber/i, /\bstatus quo\b/i, /\bim vergleich\b/i, /\bstatt\b/i, /\bohne\b/i];
const RISK_MARKERS = [
  /\brisik/i,
  /\bausfall/i,
  /\bdatenverlust/i,
  /\bincident/i,
  /\bfehler/i,
  /\bangriff/i,
  /\bunterbrech/i,
  /\bcompliance/i,
  /\beskalation/i,
];

const GENERIC_WORDS = [
  "besser",
  "optimiert",
  "effizient",
  "modern",
  "innovativ",
  "zukunftssicher",
  "flexibel",
  "skalierbar",
];

const SUBSTANCE_MARKERS = [
  "cutover",
  "runbook",
  "rpo",
  "rto",
  "mttr",
  "audit",
  "restore",
  "backup",
  "private endpoint",
  "waf",
  "rbac",
  "entra",
  "dns",
  "incident",
  "downtime",
  "datenverlust",
  "compliance",
  "monitoring",
  "alert",
  "retention",
  "failover",
  "sql",
  "api",
  "smb",
  "sharepoint",
  "key vault",
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

function rel(filePath) {
  return path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
}

function topCounts(map, limit = 10) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\u2022/g, " ")
    .trim();
}

function withSentencePunctuation(text) {
  const clean = cleanText(text).replace(/^\s*[-*]\s*/, "");
  if (!clean) {
    return "";
  }
  if (/[.!?]$/.test(clean)) {
    return clean;
  }
  return `${clean}.`;
}

function splitTextToBullets(text) {
  const raw = cleanText(text);
  if (!raw) {
    return [];
  }
  const lineSplit = raw
    .split(/\r?\n+/)
    .map((part) => part.replace(/^\s*[-*0-9.)]+\s*/, "").trim())
    .filter(Boolean);
  if (lineSplit.length > 1) {
    return lineSplit.map(withSentencePunctuation).filter(Boolean);
  }
  const semicolonSplit = raw
    .split(/\s*;\s+/)
    .map((part) => part.replace(/^\s*[-*0-9.)]+\s*/, "").trim())
    .filter(Boolean);
  if (semicolonSplit.length > 1) {
    return semicolonSplit.map(withSentencePunctuation).filter(Boolean);
  }
  return [withSentencePunctuation(raw)].filter(Boolean);
}

function normalizeBulletArray(value, options = {}) {
  const splitCompositeStrings = options.splitCompositeStrings !== false;
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string" && !splitCompositeStrings) {
          return [withSentencePunctuation(item)];
        }
        return normalizeBulletArray(item, options);
      })
      .map(withSentencePunctuation)
      .filter(Boolean);
  }
  if (typeof value === "string") {
    if (!splitCompositeStrings) {
      return [withSentencePunctuation(value)].filter(Boolean);
    }
    return splitTextToBullets(value);
  }
  if (value && typeof value === "object") {
    const preferred = ["bullets", "items", "points", "text", "description"];
    const chunks = [];
    preferred.forEach((key) => {
      if (value[key] !== undefined) {
        chunks.push(...normalizeBulletArray(value[key], options));
      }
    });
    if (chunks.length > 0) {
      return chunks;
    }
    return Object.values(value).flatMap((child) => normalizeBulletArray(child, options));
  }
  return [];
}

function uniqueBullets(bullets) {
  const seen = new Set();
  const out = [];
  bullets.forEach((bullet) => {
    const clean = withSentencePunctuation(bullet);
    if (!clean) {
      return;
    }
    const key = clean.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    out.push(clean);
  });
  return out;
}

function contextText(json) {
  const fields = [
    json.id,
    json.title,
    json.domain,
    json.theme,
    json.summary,
    json.intro,
    ...(asArray(json.tags)),
    ...(asArray(json.services)),
    ...(asArray(json.deliverables)),
  ];
  return fields.map((part) => cleanText(part)).filter(Boolean).join(" ").toLowerCase();
}

function phaseContextText(json) {
  const fields = [
    json.id,
    json.title,
    json.theme,
    ...(asArray(json.tags)),
    cleanText(json.summary || ""),
  ];
  return fields.map((part) => cleanText(part)).filter(Boolean).join(" ").toLowerCase();
}

function detectCategory(context) {
  let best = "default";
  let bestScore = 0;
  Object.entries(CATEGORY_PATTERNS).forEach(([category, patterns]) => {
    let score = 0;
    patterns.forEach((pattern) => {
      if (pattern.test(context)) {
        score += 1;
      }
    });
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  });
  return best;
}

function detectPhase(context) {
  for (const [phase, pattern] of PHASE_PATTERNS) {
    if (pattern.test(context)) {
      return phase;
    }
  }
  return null;
}

function detectProductBullet(context) {
  for (const [pattern, text] of PRODUCT_BULLETS) {
    if (pattern.test(context)) {
      return text;
    }
  }
  return null;
}

function extractRiskHint(json) {
  const risks = asArray(json.risks).map((risk) => cleanText(risk)).filter(Boolean);
  const meaningful = risks.find((risk) => !/^risiko\s*\d+$/i.test(risk));
  if (!meaningful) {
    return "";
  }
  return meaningful.replace(/[.!?]+$/, "");
}

function buildRiskBullet(baseRiskBullet, riskHint) {
  if (!riskHint) {
    return baseRiskBullet;
  }
  return `Das reduziert insbesondere das Risiko "${riskHint}" und stabilisiert den Projektverlauf.`;
}

function buildGeneratedBullets(json) {
  const title = cleanText(json.title || "der Baustein");
  const context = contextText(json);
  const phaseContext = phaseContextText(json);
  const category = detectCategory(context);
  const phase = detectPhase(phaseContext);
  const productBullet = detectProductBullet(context);
  const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.default;
  const riskHint = extractRiskHint(json);

  const bullets = [
    `Der Baustein "${title}" schafft ein klar abnehmbares Zwischenergebnis und macht Aufwand, Verantwortlichkeiten und Folgeentscheidungen transparent.`,
    template.business,
    template.status,
    buildRiskBullet(template.risk, riskHint),
    template.outcome,
  ];

  if (productBullet) {
    bullets.push(productBullet);
  } else if (phase && PHASE_BULLETS[phase]) {
    bullets.push(PHASE_BULLETS[phase]);
  }

  return uniqueBullets(bullets).slice(0, 6);
}

function hasStatusComparison(bullets) {
  return bullets.some((bullet) => STATUS_MARKERS.some((marker) => marker.test(bullet)));
}

function hasRiskReduction(bullets) {
  return bullets.some((bullet) => RISK_MARKERS.some((marker) => marker.test(bullet)));
}

function ensureQualityRules(json, bullets) {
  const result = uniqueBullets(bullets);
  const context = contextText(json);
  const phaseContext = phaseContextText(json);
  const category = detectCategory(context);
  const phase = detectPhase(phaseContext);
  const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.default;
  const productBullet = detectProductBullet(context);
  const riskHint = extractRiskHint(json);

  if (!hasStatusComparison(result)) {
    result.push(template.status);
  }
  if (!hasRiskReduction(result)) {
    result.push(buildRiskBullet(template.risk, riskHint));
  }
  if (
    productBullet &&
    !result.some((bullet) => bullet.toLowerCase() === productBullet.toLowerCase())
  ) {
    if (result.length >= 6) {
      result[result.length - 1] = productBullet;
    } else {
      result.push(productBullet);
    }
  }
  if (phase && PHASE_BULLETS[phase] && result.length < 6) {
    result.push(PHASE_BULLETS[phase]);
  }
  while (result.length < 3) {
    result.push(template.outcome);
  }
  return uniqueBullets(result).slice(0, 6);
}

function collectLegacyBullets(json) {
  const bullets = [];
  const migratedFields = [];
  LEGACY_FIELDS.forEach((field) => {
    if (json[field] !== undefined) {
      migratedFields.push(field);
      bullets.push(...normalizeBulletArray(json[field], { splitCompositeStrings: true }));
    }
  });
  return { bullets: uniqueBullets(bullets), migratedFields };
}

function normalizeMehrwertFromAny(json) {
  return uniqueBullets(normalizeBulletArray(json.mehrwert, { splitCompositeStrings: false }));
}

function buildMehrwert(json) {
  const { bullets: legacyBullets, migratedFields } = collectLegacyBullets(json);
  const existing = normalizeMehrwertFromAny(json);
  const existingValid =
    existing.length >= 3 &&
    existing.length <= 6 &&
    hasStatusComparison(existing) &&
    hasRiskReduction(existing);
  if (!FORCE_REGENERATE && existingValid && migratedFields.length === 0) {
    return {
      finalBullets: existing,
      migratedFields,
      usedLegacy: false,
    };
  }
  const generated = buildGeneratedBullets(json);
  const base = FORCE_REGENERATE ? [] : existing;
  const merged = uniqueBullets([...base, ...legacyBullets, ...generated]);
  const finalBullets = ensureQualityRules(json, merged);
  return {
    finalBullets,
    migratedFields,
    usedLegacy: legacyBullets.length > 0,
  };
}

function compareStringArrays(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (String(a[i]) !== String(b[i])) {
      return false;
    }
  }
  return true;
}

function containsSubstance(text) {
  return SUBSTANCE_MARKERS.some((marker) => text.includes(marker));
}

function potentiallyGenericMehrwert(bullets) {
  const combined = bullets.map((b) => cleanText(b).toLowerCase()).join(" ");
  const genericHits = GENERIC_WORDS.reduce((count, word) => (combined.includes(word) ? count + 1 : count), 0);
  const hasSubstance = containsSubstance(combined);
  const shortBullets = bullets.filter((b) => cleanText(b).length < 70).length;
  return (genericHits >= 2 && !hasSubstance) || (shortBullets === bullets.length && !hasSubstance);
}

function renderReport(stats, changedEntries, genericEntries) {
  const sample = changedEntries
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(10, changedEntries.length));

  const lines = [];
  lines.push("# Mehrwert Report");
  lines.push("");
  lines.push(`Erstellt am: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Aenderungsstatistik");
  lines.push(`- Leistungsscheine gesamt: ${stats.total}`);
  lines.push(`- Ohne mehrwert vor Lauf: ${stats.withoutMehrwert}`);
  lines.push(`- Geaenderte Dateien: ${stats.changed}`);
  lines.push(`- Migrierte Legacy-Felder (value/benefits/...): ${stats.migratedLegacy}`);
  lines.push("");
  lines.push("## Domain Top-Counts");
  topCounts(stats.domainCounts, 12).forEach(([name, count]) => {
    lines.push(`- ${name}: ${count}`);
  });
  lines.push("");
  lines.push("## Theme Top-Counts");
  topCounts(stats.themeCounts, 12).forEach(([name, count]) => {
    lines.push(`- ${name}: ${count}`);
  });
  lines.push("");
  lines.push("## Beispiele (10 zufaellige LS)");
  if (sample.length === 0) {
    lines.push("- Keine Aenderungen im Lauf.");
  } else {
    sample.forEach((entry) => {
      lines.push(`### ${entry.id} \`${entry.path}\``);
      entry.mehrwert.forEach((bullet) => {
        lines.push(`- ${bullet}`);
      });
      lines.push("");
    });
  }
  lines.push("## Potenziell zu generische Mehrwerte");
  if (genericEntries.length === 0) {
    lines.push("- Keine potenziell generischen Eintraege erkannt.");
  } else {
    lines.push(`- Anzahl: ${genericEntries.length}`);
    genericEntries.forEach((entry) => {
      lines.push(`- ${entry.id} \`${entry.path}\``);
    });
  }
  lines.push("");
  lines.push("_Hinweis: \"Potenziell generisch\" basiert auf einer heuristischen Wortlistenpruefung._");
  lines.push("");
  return `${lines.join("\n")}`;
}

function main() {
  const files = walkJsonFiles(ROOT_DIR, []);
  if (files.length === 0) {
    throw new Error(`Keine Leistungsscheine unter ${ROOT_DIR} gefunden.`);
  }

  const stats = {
    total: files.length,
    withoutMehrwert: 0,
    changed: 0,
    migratedLegacy: 0,
    domainCounts: new Map(),
    themeCounts: new Map(),
  };
  const changedEntries = [];
  const genericEntries = [];

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(content);

    const domain = cleanText(json.domain || "unknown");
    const theme = cleanText(json.theme || "unknown");
    stats.domainCounts.set(domain, (stats.domainCounts.get(domain) || 0) + 1);
    stats.themeCounts.set(theme, (stats.themeCounts.get(theme) || 0) + 1);

    const hadMehrwert = normalizeMehrwertFromAny(json).length > 0;
    if (!hadMehrwert) {
      stats.withoutMehrwert += 1;
    }

    const { finalBullets, migratedFields, usedLegacy } = buildMehrwert(json);
    const previousMehrwert = normalizeMehrwertFromAny(json);
    const mergedHasChanged = !compareStringArrays(previousMehrwert, finalBullets);

    let removedLegacy = false;
    migratedFields.forEach((field) => {
      if (field in json) {
        delete json[field];
        removedLegacy = true;
      }
    });

    if (mergedHasChanged || removedLegacy || !hadMehrwert) {
      json.mehrwert = finalBullets;
      stats.changed += 1;
      if (usedLegacy) {
        stats.migratedLegacy += 1;
      }

      if (!DRY_RUN) {
        fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
      }

      const entry = {
        id: cleanText(json.id || path.basename(filePath, ".json")),
        path: rel(filePath),
        mehrwert: finalBullets,
      };
      changedEntries.push(entry);
      if (potentiallyGenericMehrwert(finalBullets)) {
        genericEntries.push(entry);
      }
    } else if (potentiallyGenericMehrwert(previousMehrwert)) {
      genericEntries.push({
        id: cleanText(json.id || path.basename(filePath, ".json")),
        path: rel(filePath),
        mehrwert: previousMehrwert,
      });
    }
  });

  console.log(`[mehrwert] Dry run: ${DRY_RUN ? "ja" : "nein"}`);
  console.log(`[mehrwert] Force regenerate: ${FORCE_REGENERATE ? "ja" : "nein"}`);
  console.log(`[mehrwert] LS gesamt: ${stats.total}`);
  console.log(`[mehrwert] LS ohne mehrwert (vorher): ${stats.withoutMehrwert}`);
  console.log(`[mehrwert] Geaendert: ${stats.changed}`);
  console.log(`[mehrwert] Legacy migriert: ${stats.migratedLegacy}`);
  console.log("[mehrwert] Domain Top-Counts:");
  topCounts(stats.domainCounts, 10).forEach(([name, count]) => {
    console.log(` - ${name}: ${count}`);
  });
  console.log("[mehrwert] Theme Top-Counts:");
  topCounts(stats.themeCounts, 10).forEach(([name, count]) => {
    console.log(` - ${name}: ${count}`);
  });

  if (!DRY_RUN) {
    const report = renderReport(stats, changedEntries, genericEntries);
    fs.writeFileSync(REPORT_FILE, report, "utf8");
    console.log(`[mehrwert] Report geschrieben: ${rel(REPORT_FILE)}`);
  } else {
    console.log("[mehrwert] Dry-Run: keine Dateien geschrieben.");
  }
}

try {
  main();
} catch (error) {
  console.error(`[mehrwert] Fehler: ${error.message}`);
  process.exit(1);
}
