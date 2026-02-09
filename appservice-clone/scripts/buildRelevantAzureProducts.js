const fs = require("fs");
const path = require("path");

const INPUT_FILE = path.join(__dirname, "..", "data", "azure-products-index.de-de.json");
const OUTPUT_FILE = path.join(__dirname, "..", "data", "azure-products-relevant.json");

const POSITIVE_WEIGHTS = [
  { key: "storage", weight: 3, tag: "Storage" },
  { key: "file", weight: 3, tag: "Files" },
  { key: "blob", weight: 3, tag: "Storage" },
  { key: "virtual machine", weight: 3, tag: "Compute" },
  { key: "kubernetes", weight: 3, tag: "Containers" },
  { key: "container", weight: 2, tag: "Containers" },
  { key: "network", weight: 3, tag: "Network" },
  { key: "firewall", weight: 3, tag: "Security" },
  { key: "dns", weight: 2, tag: "Network" },
  { key: "identity", weight: 3, tag: "Identity" },
  { key: "entra", weight: 3, tag: "Identity" },
  { key: "active directory", weight: 3, tag: "Identity" },
  { key: "security", weight: 3, tag: "Security" },
  { key: "defender", weight: 2, tag: "Security" },
  { key: "key vault", weight: 3, tag: "Security" },
  { key: "database", weight: 3, tag: "Database" },
  { key: "sql", weight: 2, tag: "Database" },
  { key: "postgres", weight: 2, tag: "Database" },
  { key: "mysql", weight: 2, tag: "Database" },
  { key: "cosmos", weight: 2, tag: "Database" },
  { key: "devops", weight: 3, tag: "DevOps" },
  { key: "pipeline", weight: 2, tag: "DevOps" },
  { key: "monitor", weight: 3, tag: "Monitoring" },
  { key: "insights", weight: 2, tag: "Monitoring" },
  { key: "backup", weight: 3, tag: "Backup" },
  { key: "recovery", weight: 2, tag: "Backup" },
  { key: "migrate", weight: 2, tag: "Migration" },
  { key: "migration", weight: 2, tag: "Migration" },
  { key: "app service", weight: 3, tag: "Web Apps" },
  { key: "functions", weight: 2, tag: "Web Apps" },
  { key: "api management", weight: 2, tag: "Integration" },
  { key: "logic apps", weight: 2, tag: "Integration" },
  { key: "service bus", weight: 2, tag: "Integration" },
  { key: "event grid", weight: 2, tag: "Integration" },
  { key: "policy", weight: 2, tag: "Governance" },
  { key: "cost", weight: 2, tag: "FinOps" },
  { key: "advisor", weight: 2, tag: "FinOps" },
  { key: "virtual desktop", weight: 2, tag: "VDI" },
];

const NEGATIVE_WEIGHTS = [
  { key: "gaming", weight: -3 },
  { key: "mixed reality", weight: -2 },
  { key: "playfab", weight: -3 },
  { key: "maps", weight: -1 },
  { key: "media", weight: -2 },
  { key: "bot", weight: -1 },
  { key: "quantum", weight: -2 },
];

function normalizeText(product) {
  return [product.name, product.category, product.description, product.url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function classifyDomain(tags) {
  const has = (tag) => tags.includes(tag);
  if (has("Storage") || has("Files")) return "storage";
  if (has("Network")) return "network";
  if (has("Identity")) return "identity";
  if (has("Security")) return "security";
  if (has("Compute") || has("Containers")) return "compute";
  if (has("Database")) return "databases";
  if (has("DevOps")) return "devops";
  if (has("Governance") || has("FinOps")) return "management_governance";
  if (has("Integration")) return "integration";
  if (has("Monitoring")) return "monitoring_ops";
  if (has("Backup")) return "backup_dr";
  if (has("Migration")) return "migration";
  if (has("Web Apps")) return "web_apps";
  if (has("VDI")) return "vdi";
  return "migration";
}

function scoreProduct(product) {
  const text = normalizeText(product);
  let score = 0;
  const tags = new Set(["Azure"]);

  POSITIVE_WEIGHTS.forEach((rule) => {
    if (text.includes(rule.key)) {
      score += rule.weight;
      tags.add(rule.tag);
    }
  });

  NEGATIVE_WEIGHTS.forEach((rule) => {
    if (text.includes(rule.key)) {
      score += rule.weight;
    }
  });

  if (String(product.url || "").toLowerCase().includes("/products/")) {
    score += 1;
  }

  const tagList = Array.from(tags);
  const domainSuggestion = classifyDomain(tagList);
  return {
    score,
    tags: tagList,
    domain_suggestion: domainSuggestion,
  };
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`Input file not found: ${INPUT_FILE}`);
  }
  const index = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const products = Array.isArray(index.products) ? index.products : [];

  const scored = products
    .map((product) => {
      const meta = scoreProduct(product);
      return {
        name: product.name,
        category: product.category || "Unkategorisiert",
        description: product.description || "",
        url: product.url || "",
        ...meta,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const threshold = 3;
  const relevant = scored.filter((item) => item.score >= threshold);

  const payload = {
    generated_at: new Date().toISOString(),
    source_index: path.basename(INPUT_FILE),
    threshold,
    total_products: scored.length,
    relevant_products: relevant.length,
    products: relevant,
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `[relevance] gespeichert: ${OUTPUT_FILE} | relevant: ${relevant.length}/${scored.length} | threshold >= ${threshold}`
  );
}

try {
  main();
} catch (error) {
  console.error(`[relevance] Fehler: ${error.message}`);
  process.exit(1);
}
