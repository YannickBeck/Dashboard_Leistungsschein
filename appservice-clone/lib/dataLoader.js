const fs = require("fs");
const path = require("path");

const MODULE_ROOT = path.join(__dirname, "..", "data", "leistungsscheine");
const OFFERS_ROOT = path.join(__dirname, "..", "data", "offers");
const OFFER_CATEGORIES_FILE = path.join(OFFERS_ROOT, "categories.json");

const moduleCache = {
  signature: null,
  modules: [],
  taxonomy: [],
};

const offersCache = {
  signature: null,
  offers: [],
};

function walkJsonFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkJsonFiles(full, files);
      return;
    }
    if (entry.isFile() && full.toLowerCase().endsWith(".json")) {
      files.push(full);
    }
  });
  return files;
}

function signatureForFiles(files) {
  return files
    .map((file) => {
      const stat = fs.statSync(file);
      return `${file}:${stat.mtimeMs}:${stat.size}`;
    })
    .sort()
    .join("|");
}

function normalizeModule(raw, filePath) {
  const scope = raw.scope && typeof raw.scope === "object" ? raw.scope : {};
  const scopeQty = scope.qty && typeof scope.qty === "object" ? scope.qty : {};
  const raci = raw.raci && typeof raw.raci === "object" ? raw.raci : {};
  return {
    schema_version: String(raw.schema_version || ""),
    id: String(raw.id || "").trim(),
    title: String(raw.title || "").trim(),
    domain: String(raw.domain || "unknown").trim(),
    category: String(raw.category || raw.domain || "unknown").trim(),
    theme: String(raw.theme || "general").trim(),
    summary: String(raw.summary || "").trim(),
    delivery_model: String(raw.delivery_model || "").trim(),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    source: {
      type: raw.source?.type || "manual",
      origin: raw.source?.origin || "custom",
      url: raw.source?.url || "",
    },
    estimate: {
      unit: raw.estimate?.unit || "PT",
      min: Number(raw.estimate?.min || 0),
      likely: Number(raw.estimate?.likely || 0),
      max: Number(raw.estimate?.max || 0),
    },
    intro: String(raw.intro || "").trim(),
    services: Array.isArray(raw.services) ? raw.services : [],
    deliverables: Array.isArray(raw.deliverables) ? raw.deliverables : [],
    assumptions: Array.isArray(raw.assumptions) ? raw.assumptions : [],
    constraints: Array.isArray(raw.constraints) ? raw.constraints : [],
    out_of_scope: Array.isArray(raw.out_of_scope) ? raw.out_of_scope : [],
    acceptance: Array.isArray(raw.acceptance) ? raw.acceptance : [],
    scope: {
      description: String(scope.description || "").trim(),
      qty: {
        shares: Number.isFinite(Number(scopeQty.shares)) ? Number(scopeQty.shares) : null,
        tb: Number.isFinite(Number(scopeQty.tb)) ? Number(scopeQty.tb) : null,
        users: Number.isFinite(Number(scopeQty.users)) ? Number(scopeQty.users) : null,
        files_million: Number.isFinite(Number(scopeQty.files_million))
          ? Number(scopeQty.files_million)
          : null,
      },
      boundaries: Array.isArray(scope.boundaries) ? scope.boundaries : [],
    },
    effort_drivers: Array.isArray(raw.effort_drivers) ? raw.effort_drivers : [],
    risks: Array.isArray(raw.risks) ? raw.risks : [],
    mitigations: Array.isArray(raw.mitigations) ? raw.mitigations : [],
    customer_responsibilities: Array.isArray(raw.customer_responsibilities)
      ? raw.customer_responsibilities
      : [],
    provider_responsibilities: Array.isArray(raw.provider_responsibilities)
      ? raw.provider_responsibilities
      : [],
    raci: {
      customer: Array.isArray(raci.customer) ? raci.customer : [],
      provider: Array.isArray(raci.provider) ? raci.provider : [],
    },
    change_control: String(raw.change_control || "").trim(),
    notes: raw.notes == null ? "" : String(raw.notes),
    dependencies: {
      requires: Array.isArray(raw.dependencies?.requires) ? raw.dependencies.requires : [],
      excludes: Array.isArray(raw.dependencies?.excludes) ? raw.dependencies.excludes : [],
    },
    __meta: {
      filePath,
    },
  };
}

function buildTaxonomy(modules) {
  const domainMap = new Map();
  modules.forEach((module) => {
    const domainEntry = domainMap.get(module.domain) || {
      domain: module.domain,
      count: 0,
      themes: new Map(),
    };
    domainEntry.count += 1;
    const themeEntry = domainEntry.themes.get(module.theme) || {
      theme: module.theme,
      count: 0,
    };
    themeEntry.count += 1;
    domainEntry.themes.set(module.theme, themeEntry);
    domainMap.set(module.domain, domainEntry);
  });

  return Array.from(domainMap.values())
    .map((entry) => ({
      domain: entry.domain,
      count: entry.count,
      themes: Array.from(entry.themes.values()).sort((a, b) => a.theme.localeCompare(b.theme)),
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

function getModules() {
  const files = walkJsonFiles(MODULE_ROOT);
  const signature = signatureForFiles(files);
  if (moduleCache.signature === signature) {
    return {
      modules: moduleCache.modules,
      taxonomy: moduleCache.taxonomy,
    };
  }

  const modules = files
    .map((file) => normalizeModule(JSON.parse(fs.readFileSync(file, "utf8")), file))
    .filter((module) => module.id && module.title)
    .sort((a, b) => a.id.localeCompare(b.id));

  const taxonomy = buildTaxonomy(modules);
  moduleCache.signature = signature;
  moduleCache.modules = modules;
  moduleCache.taxonomy = taxonomy;
  return { modules, taxonomy };
}

function getOffers() {
  const files = walkJsonFiles(OFFERS_ROOT);
  const categoriesStat = fs.existsSync(OFFER_CATEGORIES_FILE)
    ? fs.statSync(OFFER_CATEGORIES_FILE)
    : null;
  const categoriesSignature = categoriesStat
    ? `${OFFER_CATEGORIES_FILE}:${categoriesStat.mtimeMs}:${categoriesStat.size}`
    : "categories:none";
  const signature = signatureForFiles(files);
  const fullSignature = `${signature}|${categoriesSignature}`;
  if (offersCache.signature === fullSignature) {
    return offersCache.offers;
  }

  const categories = (() => {
    if (!fs.existsSync(OFFER_CATEGORIES_FILE)) {
      return [];
    }
    try {
      const json = JSON.parse(fs.readFileSync(OFFER_CATEGORIES_FILE, "utf8"));
      if (!Array.isArray(json)) {
        return [];
      }
      return json
        .filter((item) => item && item.id)
        .map((item) => ({
          id: String(item.id),
          title: String(item.title || item.id),
          order: Number(item.order || 999),
        }))
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    } catch (_error) {
      return [];
    }
  })();
  const categoryById = new Map(categories.map((item) => [item.id, item]));

  const offers = files
    .filter((file) => path.resolve(file) !== path.resolve(OFFER_CATEGORIES_FILE))
    .map((file) => ({ file, raw: JSON.parse(fs.readFileSync(file, "utf8")) }))
    .map((entry) => {
      const raw = entry.raw || {};
      const moduleIds = Array.isArray(raw.module_ids)
        ? raw.module_ids
        : Array.isArray(raw.defaultSelected)
          ? raw.defaultSelected
          : [];
      if (!raw.id || moduleIds.length === 0) {
        return null;
      }
      const categoryId = String(raw.category || "general");
      const category = categoryById.get(categoryId);
      return {
        id: String(raw.id),
        name: String(raw.name || raw.title || raw.id),
        title: String(raw.title || raw.name || raw.id),
        description: String(raw.description || ""),
        category: categoryId,
        category_title: category?.title || categoryId,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        module_ids: moduleIds.map((id) => String(id)),
        defaultSelected: moduleIds.map((id) => String(id)),
        defaults: raw.defaults && typeof raw.defaults === "object" ? raw.defaults : {},
        __meta: {
          filePath: entry.file,
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const catA = categoryById.get(a.category);
      const catB = categoryById.get(b.category);
      const ordA = catA ? catA.order : 999;
      const ordB = catB ? catB.order : 999;
      if (ordA !== ordB) {
        return ordA - ordB;
      }
      return String(a.title || a.id).localeCompare(String(b.title || b.id));
    });

  offersCache.signature = fullSignature;
  offersCache.offers = offers;
  return offers;
}

module.exports = {
  getModules,
  getOffers,
};
