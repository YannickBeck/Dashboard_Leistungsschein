const fs = require("fs");
const path = require("path");

const MODULE_ROOT = path.join(__dirname, "..", "data", "leistungsscheine");
const OFFERS_ROOT = path.join(__dirname, "..", "data", "offers");
const ONPREM_OFFERS_ROOT = path.join(OFFERS_ROOT, "onprem-migrationen");
const CATEGORIES_FILE = path.join(OFFERS_ROOT, "categories.json");

const PRESET_DEFINITIONS = [
  {
    id: "onprem_files_to_azurefiles_standard",
    title: "Fileserver -> Azure Files (Standard)",
    description:
      "Assessment + Design + Build + Migration + Tests + Handover fuer Fileserver nach Azure Files.",
    tags: ["On-Prem", "Migration", "Azure Files"],
    prefixes: ["LS-OPM-FILES-AZFILES-"],
    fallback: ["LS-1001", "LS-1002", "LS-1003", "LS-1010", "LS-1011", "LS-1012", "LS-1013", "LS-1014"]
  },
  {
    id: "onprem_files_to_sharepoint_standard",
    title: "Fileserver -> SharePoint Online / OneDrive (Standard)",
    description:
      "Assessment + Informationsarchitektur + Migration + Enablement fuer Fileserver nach SharePoint/OneDrive.",
    tags: ["On-Prem", "Migration", "SharePoint Online", "OneDrive"],
    prefixes: ["LS-OPM-FILES-SPOD-"],
    fallback: ["LS-1001", "LS-1002", "LS-1025", "LS-1026", "LS-1005"]
  },
  {
    id: "onprem_exchange_to_exo_standard",
    title: "Exchange -> Exchange Online (Standard)",
    description:
      "Assessment + Design + Build + Migrationsbatches + Cutover + Handover fuer Exchange Online.",
    tags: ["On-Prem", "Migration", "Exchange Online"],
    prefixes: ["LS-OPM-EXCHANGE-EXO-"],
    fallback: ["LS-1001", "LS-1017", "LS-1018", "LS-1025", "LS-1026"]
  },
  {
    id: "onprem_sql_to_azsqlmi_standard",
    title: "SQL Server -> Azure SQL MI (Standard)",
    description:
      "Assessment, Architektur, Migration und Betriebsuebergabe fuer Azure SQL Managed Instance.",
    tags: ["On-Prem", "Migration", "Azure SQL MI"],
    prefixes: ["LS-OPM-SQL-AZSQLMI-"],
    fallback: ["LS-1028", "LS-1023", "LS-1015", "LS-1016"]
  },
  {
    id: "onprem_dns_to_private_resolver_standard",
    title: "DNS Hybrid -> Private DNS + Resolver (Standard)",
    description:
      "Assessment + Design + Build + Test + Ops fuer Azure DNS Private Resolver und Private DNS.",
    tags: ["On-Prem", "Migration", "DNS", "Private Resolver"],
    prefixes: ["LS-OPM-DNS-AZDNSPR-"],
    fallback: ["LS-1011", "LS-1012", "LS-1015", "LS-1016"]
  },
  {
    id: "onprem_sftp_to_blob_sftp_standard",
    title: "SFTP Server -> Blob SFTP (Standard)",
    description:
      "Assessment + Build + Migration + Cutover + Monitoring fuer Azure Blob Storage mit SFTP.",
    tags: ["On-Prem", "Migration", "SFTP", "Blob Storage"],
    prefixes: ["LS-OPM-SFTP-BLOBSFTP-"],
    fallback: ["LS-1009", "LS-1011", "LS-1012", "LS-1013", "LS-1014"]
  },
  {
    id: "onprem_rds_to_avd_standard",
    title: "RDS / Terminalserver -> AVD (Standard)",
    description:
      "Assessment + Design + Build + Pilot + Cutover fuer Azure Virtual Desktop.",
    tags: ["On-Prem", "Migration", "AVD"],
    prefixes: ["LS-OPM-AVD-AVD-"],
    fallback: ["LS-1029", "LS-1011", "LS-1012", "LS-1015"]
  },
  {
    id: "onprem_monitoring_to_azuremonitor_standard",
    title: "Monitoring -> Azure Monitor (Standard)",
    description:
      "Observability-Rollout mit Workspace, Alerts, Dashboards, Runbooks und Tuning.",
    tags: ["On-Prem", "Migration", "Azure Monitor"],
    prefixes: ["LS-OPM-MONITOR-AZMON-"],
    fallback: ["LS-1468", "LS-1469", "LS-1470", "LS-1471", "LS-1472"]
  },
  {
    id: "onprem_siem_to_sentinel_standard",
    title: "SIEM -> Microsoft Sentinel (Standard)",
    description:
      "Assessment + Data Connector Setup + Detection + SOC-Enablement fuer Sentinel.",
    tags: ["On-Prem", "Migration", "Sentinel", "SIEM"],
    prefixes: ["LS-OPM-SENTINEL-SENTINEL-"],
    fallback: ["LS-1019", "LS-1020", "LS-1015", "LS-1016"]
  },
  {
    id: "onprem_backup_to_azurebackup_standard",
    title: "Backup -> Azure Backup (Standard)",
    description:
      "Backup-Design, Umsetzung, Restore-Tests und Betriebsuebergabe fuer Azure Backup.",
    tags: ["On-Prem", "Migration", "Azure Backup"],
    prefixes: ["LS-OPM-BACKUP-AZBACKUP-"],
    fallback: ["LS-1013", "LS-1014", "LS-1015"]
  },
  {
    id: "onprem_dr_to_asr_standard",
    title: "Disaster Recovery -> Azure Site Recovery (Standard)",
    description:
      "DR-Readiness, Replikation, Failover-Test und Uebergabe fuer Azure Site Recovery.",
    tags: ["On-Prem", "Migration", "ASR", "Disaster Recovery"],
    prefixes: ["LS-OPM-ASR-ASR-"],
    fallback: ["LS-1013", "LS-1014", "LS-1015"]
  },
  {
    id: "onprem_waf_standard",
    title: "Reverse Proxy / WAF -> Azure WAF (Standard)",
    description:
      "Design + Build + Rule-Tuning fuer Application Gateway WAF / Front Door WAF.",
    tags: ["On-Prem", "Migration", "WAF"],
    prefixes: ["LS-OPM-WAF-AGWAF-", "LS-OPM-WAF-AZFDWAF-"],
    fallback: ["LS-1011", "LS-1012", "LS-1019", "LS-1015"]
  },
  {
    id: "onprem_apim_standard",
    title: "API Gateway -> API Management (Standard)",
    description:
      "Assessment + API-Policy-Design + Publishing + Governance fuer Azure API Management.",
    tags: ["On-Prem", "Migration", "API Management"],
    prefixes: ["LS-OPM-APIM-APIM-"],
    fallback: ["LS-1030", "LS-1018", "LS-1019"]
  },
  {
    id: "onprem_intune_standard",
    title: "Endpoint Mgmt -> Intune (Standard)",
    description:
      "SCCM-lastige Endpoint-Verwaltung nach Intune inkl. Enrollment, Policies und Rollout.",
    tags: ["On-Prem", "Migration", "Intune"],
    prefixes: ["LS-OPM-INTUNE-INTUNE-"],
    fallback: ["LS-1022", "LS-1023", "LS-1025", "LS-1026"]
  },
  {
    id: "onprem_keyvault_standard",
    title: "Secrets / Cert Store -> Key Vault (Standard)",
    description:
      "Zentrales Secrets- und Zertifikatsmanagement mit Azure Key Vault.",
    tags: ["On-Prem", "Migration", "Key Vault"],
    prefixes: ["LS-OPM-KEYVAULT-AZKV-"],
    fallback: ["LS-1019", "LS-1018", "LS-1023"]
  },
  {
    id: "onprem_messaging_servicebus_eventgrid_standard",
    title: "Message Broker -> Service Bus / Event Grid (Standard)",
    description:
      "Messaging-Migration fuer Queues/Topics/Events mit Betriebsuebergabe.",
    tags: ["On-Prem", "Migration", "Service Bus", "Event Grid"],
    prefixes: ["LS-OPM-MESSAGING-SB-EG-"],
    fallback: ["LS-1030", "LS-1015", "LS-1016"]
  },
  {
    id: "onprem_teams_phone_standard",
    title: "PBX -> Teams Phone (Standard)",
    description:
      "Assessment + Rufnummernstrategie + Pilot + Cutover fuer Teams Phone.",
    tags: ["On-Prem", "Migration", "Teams Phone"],
    prefixes: ["LS-OPM-TEAMS-PHONE-TPHONE-"],
    fallback: ["LS-1025", "LS-1026", "LS-1005"]
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

function loadModuleIds() {
  return walkJsonFiles(MODULE_ROOT, [])
    .map((filePath) => {
      try {
        const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return String(json.id || "");
      } catch (_error) {
        return "";
      }
    })
    .filter(Boolean)
    .sort();
}

function pickModuleIds(availableIds, prefixes, fallbackIds, targetSize = 10) {
  const selected = availableIds.filter((id) =>
    prefixes.some((prefix) => id.toUpperCase().startsWith(prefix.toUpperCase()))
  );
  const unique = Array.from(new Set(selected)).slice(0, targetSize);
  if (unique.length > 0) {
    return unique;
  }
  return fallbackIds.filter((id) => availableIds.includes(id));
}

function upsertCategories() {
  const existing = (() => {
    if (!fs.existsSync(CATEGORIES_FILE)) {
      return [];
    }
    try {
      const json = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf8"));
      return Array.isArray(json) ? json : [];
    } catch (_error) {
      return [];
    }
  })();

  const byId = new Map(existing.filter((item) => item && item.id).map((item) => [item.id, item]));
  byId.set("onprem-migrationen", {
    id: "onprem-migrationen",
    title: "On-Prem Migrationen",
    order: 10
  });
  const merged = Array.from(byId.values())
    .map((item) => ({
      id: String(item.id),
      title: String(item.title || item.id),
      order: Number(item.order || 999)
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  fs.mkdirSync(path.dirname(CATEGORIES_FILE), { recursive: true });
  fs.writeFileSync(CATEGORIES_FILE, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}

function main() {
  const availableIds = loadModuleIds();
  fs.mkdirSync(ONPREM_OFFERS_ROOT, { recursive: true });
  upsertCategories();

  let written = 0;
  PRESET_DEFINITIONS.forEach((preset) => {
    const selected = pickModuleIds(availableIds, preset.prefixes, preset.fallback, 12);
    if (selected.length === 0) {
      return;
    }
    const payload = {
      id: preset.id,
      category: "onprem-migrationen",
      title: preset.title,
      name: preset.title,
      description: preset.description,
      defaultSelected: selected,
      module_ids: selected,
      tags: preset.tags,
      defaults: {
        offerVariant: preset.title,
        deliveryModel: "T&M / Aufwandsschaetzung"
      }
    };
    const targetFile = path.join(ONPREM_OFFERS_ROOT, `${preset.id}.json`);
    fs.writeFileSync(targetFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    written += 1;
  });

  console.log(
    `[onprem-presets] geschrieben: ${written} Presets | Kategorie: onprem-migrationen | Ziel: ${ONPREM_OFFERS_ROOT}`
  );
}

try {
  main();
} catch (error) {
  console.error(`[onprem-presets] Fehler: ${error.message}`);
  process.exit(1);
}
