const express = require("express");
const path = require("path");
const { buildOfferDocx } = require("./offerDocx");
const { getModules, getOffers } = require("./lib/dataLoader");

const app = express();
const PORT = process.env.PORT || 3000;

function normalizeEstimate(estimate) {
  return {
    unit: estimate?.unit || "PT",
    min: Number(estimate?.min || 0),
    likely: Number(estimate?.likely || 0),
    max: Number(estimate?.max || 0),
  };
}

function resolveSelection(selectedIds, moduleById) {
  const orderedInput = selectedIds.filter((id) => moduleById.has(id));
  const order = new Map();
  orderedInput.forEach((id, index) => order.set(id, index));

  const selected = new Set(orderedInput);

  let changed = true;
  while (changed) {
    changed = false;
    Array.from(selected).forEach((id) => {
      const module = moduleById.get(id);
      const requires = Array.isArray(module?.dependencies?.requires) ? module.dependencies.requires : [];
      requires.forEach((requiredId) => {
        if (moduleById.has(requiredId) && !selected.has(requiredId)) {
          selected.add(requiredId);
          order.set(requiredId, order.size + 1000);
          changed = true;
        }
      });
    });
  }

  const selectedOrdered = Array.from(selected).sort((a, b) => {
    const aRank = order.has(a) ? order.get(a) : Number.MAX_SAFE_INTEGER;
    const bRank = order.has(b) ? order.get(b) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return a.localeCompare(b);
  });

  // Resolve excludes by keeping the earlier-ranked element.
  selectedOrdered.forEach((id) => {
    if (!selected.has(id)) {
      return;
    }
    const module = moduleById.get(id);
    const excludes = Array.isArray(module?.dependencies?.excludes) ? module.dependencies.excludes : [];
    excludes.forEach((excludedId) => {
      if (!selected.has(excludedId)) {
        return;
      }
      const idRank = order.get(id) ?? Number.MAX_SAFE_INTEGER;
      const excludedRank = order.get(excludedId) ?? Number.MAX_SAFE_INTEGER;
      if (idRank <= excludedRank) {
        selected.delete(excludedId);
      } else {
        selected.delete(id);
      }
    });
  });

  // Resolve option groups by keeping the earliest-ranked module.
  const groupKeep = new Map();
  Array.from(selected).forEach((id) => {
    const module = moduleById.get(id);
    if (!module?.option_group) {
      return;
    }
    const current = groupKeep.get(module.option_group);
    if (!current) {
      groupKeep.set(module.option_group, id);
      return;
    }
    const currentRank = order.get(current) ?? Number.MAX_SAFE_INTEGER;
    const candidateRank = order.get(id) ?? Number.MAX_SAFE_INTEGER;
    if (candidateRank < currentRank) {
      selected.delete(current);
      groupKeep.set(module.option_group, id);
    } else {
      selected.delete(id);
    }
  });

  return Array.from(selected).sort((a, b) => {
    const aRank = order.has(a) ? order.get(a) : Number.MAX_SAFE_INTEGER;
    const bRank = order.has(b) ? order.get(b) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return a.localeCompare(b);
  });
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/modules", (_req, res) => {
  try {
    const { modules } = getModules();
    res.json(modules);
  } catch (error) {
    res.status(500).json({
      error: "MODULES_LOAD_FAILED",
      message: "Leistungsscheine konnten nicht geladen werden.",
    });
  }
});

app.get("/api/taxonomy", (_req, res) => {
  try {
    const { taxonomy } = getModules();
    res.json(taxonomy);
  } catch (error) {
    res.status(500).json({
      error: "TAXONOMY_LOAD_FAILED",
      message: "Taxonomie konnte nicht geladen werden.",
    });
  }
});

app.get("/api/offers", (_req, res) => {
  try {
    const offers = getOffers();
    res.json(offers);
  } catch (error) {
    res.status(500).json({
      error: "OFFERS_LOAD_FAILED",
      message: "Angebotsvorlagen konnten nicht geladen werden.",
    });
  }
});

app.post("/api/generate", async (req, res) => {
  try {
    const rawIds = req.body?.selectedModuleIds;
    const selectedModuleIds = Array.isArray(rawIds)
      ? Array.from(new Set(rawIds.map((id) => String(id))))
      : [];
    if (selectedModuleIds.length === 0) {
      res.status(400).json({
        error: "INVALID_SELECTION",
        message: "Bitte mindestens einen Leistungsschein auswaehlen.",
      });
      return;
    }

    const { modules } = getModules();
    const moduleById = new Map(modules.map((module) => [module.id, module]));
    const resolvedIds = resolveSelection(selectedModuleIds, moduleById);
    const resolvedModules = resolvedIds.map((id) => moduleById.get(id)).filter(Boolean);
    if (resolvedModules.length === 0) {
      res.status(400).json({
        error: "NO_VALID_MODULES",
        message: "Keine gueltigen Leistungsscheine ausgewaehlt.",
      });
      return;
    }

    const totals = resolvedModules.reduce(
      (acc, module) => {
        const estimate = normalizeEstimate(module.estimate);
        return {
          min: acc.min + estimate.min,
          likely: acc.likely + estimate.likely,
          max: acc.max + estimate.max,
        };
      },
      { min: 0, likely: 0, max: 0 }
    );

    const ratePerDay = Number(req.body?.ratePerDay);
    const offerMeta = {
      customer: req.body?.customer || "<<Kundenname>>",
      projectName: req.body?.projectName || "Azure Angebots-Baukasten",
      version: req.body?.version || "1.0",
      date: req.body?.date || new Date().toISOString().slice(0, 10),
      provider: req.body?.provider || "<<Firmenname>>",
      offerVariant: req.body?.offerVariant || "Individuell",
      teamRole: req.body?.teamRole || "",
      ratePerDay: Number.isFinite(ratePerDay) && ratePerDay > 0 ? ratePerDay : null,
      deliveryModel: "T&M / Aufwandsschaetzung",
      totals,
      resolvedSelection: resolvedIds,
    };

    const buffer = await buildOfferDocx({
      meta: offerMeta,
      modules: resolvedModules,
    });

    const safeCustomer = offerMeta.customer.replace(/[^A-Za-z0-9_-]+/g, "_");
    const filename = `Angebot_${safeCustomer}_${offerMeta.date}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("X-Resolved-Selection", resolvedIds.join(","));
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      error: "DOCX_GENERATION_FAILED",
      message: "Angebot konnte nicht generiert werden.",
    });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
