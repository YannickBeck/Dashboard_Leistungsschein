const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const SOURCE_URL = "https://azure.microsoft.com/de-de/products";
const OUTPUT_FILE = path.join(__dirname, "..", "data", "azure-products-index.de-de.json");
const USER_AGENT =
  "LeistungsscheinIndexer/2.0 (+https://localhost) NodeFetch AzureProductsIndex";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = 4, delayMs = 1200) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "user-agent": USER_AGENT,
          "accept-language": "de-DE,de;q=0.9,en;q=0.8",
          ...(options.headers || {})
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await sleep(delayMs * attempt);
    }
  }
  throw new Error("Unreachable retry state");
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(href) {
  if (!href) {
    return null;
  }
  const clean = href.trim();
  if (!clean) {
    return null;
  }
  try {
    return new URL(clean, "https://azure.microsoft.com").toString();
  } catch (_error) {
    return null;
  }
}

function isProductLink(url) {
  if (!url) {
    return false;
  }
  const lower = url.toLowerCase();
  if (!lower.includes("/products/")) {
    return false;
  }
  if (
    lower.includes("/products/pricing") ||
    lower.includes("/products/overview") ||
    lower.includes("/products/compare") ||
    lower.includes("/products/category") ||
    lower.includes("/products/details")
  ) {
    return false;
  }
  if (lower.includes("#")) {
    return false;
  }
  return true;
}

function inferRawCategory($, anchor) {
  const headingSelectors = "h2, h3, h4";
  let current = anchor.parent();
  let depth = 0;
  while (current.length && depth < 10) {
    const siblingHeading = current.prevAll(headingSelectors).first();
    const siblingText = normalizeText(siblingHeading.text());
    if (siblingText) {
      return siblingText;
    }
    const localHeading = current.children(headingSelectors).first();
    const localText = normalizeText(localHeading.text());
    if (localText) {
      return localText;
    }
    current = current.parent();
    depth += 1;
  }
  const sectionHeading = normalizeText(anchor.closest("section").find(headingSelectors).first().text());
  return sectionHeading || "Unkategorisiert";
}

function normalizeCategory(product) {
  const text = [
    product.category_raw,
    product.name,
    product.description,
    product.url
  ]
    .join(" ")
    .toLowerCase();

  const rules = [
    { key: "storage", value: "Storage" },
    { key: "speicher", value: "Storage" },
    { key: "files", value: "Storage" },
    { key: "blob", value: "Storage" },
    { key: "compute", value: "Compute" },
    { key: "virtuelle computer", value: "Compute" },
    { key: "virtual machine", value: "Compute" },
    { key: "containers", value: "Containers" },
    { key: "kubernetes", value: "Containers" },
    { key: "netzwerk", value: "Network" },
    { key: "network", value: "Network" },
    { key: "dns", value: "Network" },
    { key: "identity", value: "Identity" },
    { key: "entra", value: "Identity" },
    { key: "active directory", value: "Identity" },
    { key: "security", value: "Security" },
    { key: "sicherheit", value: "Security" },
    { key: "defender", value: "Security" },
    { key: "governance", value: "Governance" },
    { key: "management", value: "Governance" },
    { key: "database", value: "Databases" },
    { key: "datenbank", value: "Databases" },
    { key: "sql", value: "Databases" },
    { key: "devops", value: "DevOps" },
    { key: "monitor", value: "Monitoring" },
    { key: "insights", value: "Monitoring" },
    { key: "backup", value: "Backup & DR" },
    { key: "recovery", value: "Backup & DR" },
    { key: "disaster", value: "Backup & DR" },
    { key: "integration", value: "Integration" },
    { key: "logic apps", value: "Integration" },
    { key: "service bus", value: "Integration" },
    { key: "event grid", value: "Integration" },
    { key: "web", value: "Web Apps" },
    { key: "app service", value: "Web Apps" },
    { key: "functions", value: "Web Apps" },
    { key: "virtual desktop", value: "VDI" },
    { key: "migration", value: "Migration" },
    { key: "migrate", value: "Migration" }
  ];

  for (const rule of rules) {
    if (text.includes(rule.key)) {
      return rule.value;
    }
  }
  return "Unkategorisiert";
}

function extractProducts(html) {
  const $ = cheerio.load(html);
  const productMap = new Map();

  $("a[href]").each((_, node) => {
    const anchor = $(node);
    const href = anchor.attr("href");
    const url = normalizeUrl(href);
    if (!isProductLink(url)) {
      return;
    }

    const name = normalizeText(anchor.text() || anchor.attr("aria-label") || anchor.attr("title") || "");
    if (!name || name.length < 2) {
      return;
    }

    const description = normalizeText(
      anchor.attr("data-bi-name") ||
        anchor.attr("title") ||
        anchor.closest("article, li, div").find("p").first().text() ||
        ""
    );
    const categoryRaw = inferRawCategory($, anchor);
    const key = url.toLowerCase();

    if (!productMap.has(key)) {
      const product = {
        name,
        category_raw: categoryRaw || "Unkategorisiert",
        category: "Unkategorisiert",
        url,
        description: description || ""
      };
      product.category = normalizeCategory(product);
      productMap.set(key, product);
      return;
    }

    const existing = productMap.get(key);
    if (!existing.description && description) {
      existing.description = description;
    }
    if (
      (!existing.category_raw || existing.category_raw === "Unkategorisiert") &&
      categoryRaw &&
      categoryRaw !== "Unkategorisiert"
    ) {
      existing.category_raw = categoryRaw;
    }
    existing.category = normalizeCategory(existing);
  });

  const products = Array.from(productMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((product, index) => ({
      index: index + 1,
      ...product
    }));

  const categoryMap = new Map();
  products.forEach((product) => {
    const list = categoryMap.get(product.category) || [];
    list.push({
      name: product.name,
      url: product.url,
      description: product.description
    });
    categoryMap.set(product.category, list);
  });

  const categories = Array.from(categoryMap.entries())
    .map(([name, list]) => ({
      name,
      count: list.length,
      products: list.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { products, categories };
}

function extractProductDetails(html) {
  const $ = cheerio.load(html);
  const heading = normalizeText($("h1").first().text());
  const description =
    normalizeText($('meta[name="description"]').attr("content")) ||
    normalizeText($("main p").first().text());
  const pricingUrl = normalizeUrl(
    $('a[href*="/pricing/"], a[href*="/preise"], a[href*="pricing"]').first().attr("href")
  );
  return {
    heading,
    description,
    pricing_url: pricingUrl || ""
  };
}

async function enrichDetails(products, limit) {
  const out = [];
  const max = Math.max(0, Math.min(Number(limit || 0), products.length));
  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    if (index < max) {
      try {
        const response = await fetchWithRetry(product.url, {}, 3, 1000);
        const html = await response.text();
        const details = extractProductDetails(html);
        out.push({ ...product, details });
      } catch (_error) {
        out.push({ ...product, details: { heading: product.name, description: product.description, pricing_url: "" } });
      }
      await sleep(300);
    } else {
      out.push(product);
    }
  }
  return out;
}

async function main() {
  const detailsEnabled = process.env.ENRICH_PRODUCT_DETAILS === "1";
  const detailLimit = Number(process.env.DETAIL_LIMIT || 20);

  console.log(`[index] Lade: ${SOURCE_URL}`);
  const response = await fetchWithRetry(SOURCE_URL, {}, 4, 1200);
  const html = await response.text();
  await sleep(700);

  const extracted = extractProducts(html);
  const products = detailsEnabled
    ? await enrichDetails(extracted.products, detailLimit)
    : extracted.products;

  const payload = {
    generated_at: new Date().toISOString(),
    source_url: SOURCE_URL,
    market: "de-de",
    details_enriched: detailsEnabled,
    detail_limit: detailsEnabled ? detailLimit : 0,
    count_products: products.length,
    count_categories: extracted.categories.length,
    categories: extracted.categories,
    products
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `[index] gespeichert: ${OUTPUT_FILE} | Produkte: ${products.length} | Kategorien: ${extracted.categories.length}`
  );
}

main().catch((error) => {
  console.error(`[index] Fehler: ${error.message}`);
  process.exit(1);
});
