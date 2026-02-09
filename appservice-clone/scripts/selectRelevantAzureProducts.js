const fs = require("fs");
const path = require("path");

const INPUT_FILE = path.join(__dirname, "..", "data", "azure-products-index.de-de.json");
const OUTPUT_FILE = path.join(__dirname, "..", "data", "azure-products-relevant.json");

const POSITIVE_RULES = [
  { key: "storage", weight: 4, tag: "Storage" },
  { key: "files", weight: 4, tag: "Storage" },
  { key: "blob", weight: 3, tag: "Storage" },
  { key: "network", weight: 4, tag: "Network" },
  { key: "dns", weight: 3, tag: "Network" },
  { key: "private endpoint", weight: 4, tag: "Network" },
  { key: "identity", weight: 4, tag: "Identity" },
  { key: "entra", weight: 4, tag: "Identity" },
  { key: "active directory", weight: 4, tag: "Identity" },
  { key: "security", weight: 4, tag: "Security" },
  { key: "defender", weight: 3, tag: "Security" },
  { key: "key vault", weight: 3, tag: "Security" },
  { key: "firewall", weight: 3, tag: "Security" },
  { key: "compute", weight: 3, tag: "Compute" },
  { key: "virtual machine", weight: 3, tag: "Compute" },
  { key: "containers", weight: 3, tag: "Compute" },
  { key: "kubernetes", weight: 3, tag: "Compute" },
  { key: "database", weight: 4, tag: "Databases" },
  { key: "sql", weight: 3, tag: "Databases" },
  { key: "postgres", weight: 3, tag: "Databases" },
  { key: "mysql", weight: 3, tag: "Databases" },
  { key: "cosmos", weight: 3, tag: "Databases" },
  { key: "devops", weight: 4, tag: "DevOps" },
  { key: "pipeline", weight: 3, tag: "DevOps" },
  { key: "monitor", weight: 4, tag: "Monitoring" },
  { key: "insights", weight: 3, tag: "Monitoring" },
  { key: "backup", weight: 4, tag: "Backup" },
  { key: "recovery", weight: 3, tag: "Backup" },
  { key: "disaster", weight: 3, tag: "Backup" },
  { key: "migrate", weight: 4, tag: "Migration" },
  { key: "migration", weight: 4, tag: "Migration" },
  { key: "governance", weight: 3, tag: "Governance" },
  { key: "policy", weight: 3, tag: "Governance" },
  { key: "cost", weight: 2, tag: "FinOps" },
  { key: "advisor", weight: 2, tag: "FinOps" },
  { key: "integration", weight: 3, tag: "Integration" },
  { key: "logic apps", weight: 3, tag: "Integration" },
  { key: "service bus", weight: 3, tag: "Integration" },
  { key: "event grid", weight: 3, tag: "Integration" },
  { key: "app service", weight: 3, tag: "Web Apps" },
  { key: "functions", weight: 3, tag: "Web Apps" },
  { key: "virtual desktop", weight: 3, tag: "VDI" }
];

const NEGATIVE_RULES = [
  { key: "gaming", weight: -4 },
  { key: "playfab", weight: -4 },
  { key: "mixed reality", weight: -3 },
  { key: "holo", weight: -3 },
  { key: "quantum", weight: -3 },
  { key: "media services", weight: -2 },
  { key: "maps", weight: -2 }
];

function normalizeText(product) {
  return [product.name, product.category, product.category_raw, product.description, product.url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function classifyDomain(tags) {
  const has = (tag) => tags.includes(tag);
  if (has("Storage")) return "storage";
  if (has("Network")) return "network";
  if (has("Identity")) return "identity";
  if (has("Security")) return "security";
  if (has("Compute")) return "compute";
  if (has("Databases")) return "databases";
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
  const rationale = [];

  POSITIVE_RULES.forEach((rule) => {
    if (text.includes(rule.key)) {
      score += rule.weight;
      tags.add(rule.tag);
      rationale.push(`+${rule.weight}:${rule.key}`);
    }
  });

  NEGATIVE_RULES.forEach((rule) => {
    if (text.includes(rule.key)) {
      score += rule.weight;
      rationale.push(`${rule.weight}:${rule.key}`);
    }
  });

  if (String(product.url || "").includes("/products/")) {
    score += 1;
    rationale.push("+1:url-products");
  }
  if (String(product.category || "").toLowerCase() !== "unkategorisiert") {
    score += 1;
    rationale.push("+1:category-known");
  }

  const tagList = Array.from(tags);
  return {
    score,
    tags: tagList,
    rationale,
    domain_suggestion: classifyDomain(tagList)
  };
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`Input file nicht gefunden: ${INPUT_FILE}`);
  }
  const index = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const products = Array.isArray(index.products) ? index.products : [];
  if (!products.length) {
    throw new Error("Index enthaelt keine Produkte.");
  }

  const scored = products
    .map((product) => ({
      name: product.name,
      category: product.category || "Unkategorisiert",
      category_raw: product.category_raw || "",
      description: product.description || "",
      url: product.url || "",
      ...scoreProduct(product)
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const threshold = Number(process.env.RELEVANCE_THRESHOLD || 3);
  const relevant = scored.filter((item) => item.score >= threshold);

  const payload = {
    generated_at: new Date().toISOString(),
    source_index: path.basename(INPUT_FILE),
    threshold,
    total_products: scored.length,
    relevant_products: relevant.length,
    products: relevant
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
