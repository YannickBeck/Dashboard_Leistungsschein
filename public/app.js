(function appBootstrap() {
  const state = {
    modules: [],
    offers: [],
    taxonomy: [],
    selectedIds: new Set(),
    searchTerm: "",
    domain: "",
    theme: "",
    deliveryModel: "",
    selectedPreset: "",
    activeId: "",
  };

  const el = {
    moduleGrid: document.getElementById("moduleGrid"),
    taxonomyTree: document.getElementById("taxonomyTree"),
    detailsBtn: document.getElementById("detailsBtn"),
    detailBackdrop: document.getElementById("detailBackdrop"),
    detailModal: document.getElementById("detailModal"),
    detailModalTitle: document.getElementById("detailModalTitle"),
    detailModalBody: document.getElementById("detailModalBody"),
    closeDetailModalBtn: document.getElementById("closeDetailModalBtn"),
    selectionCount: document.getElementById("selectionCount"),
    selectedIds: document.getElementById("selectedIds"),
    missingDependencies: document.getElementById("missingDependencies"),
    selectionConflicts: document.getElementById("selectionConflicts"),
    ptRange: document.getElementById("ptRange"),
    ptLikely: document.getElementById("ptLikely"),
    costRange: document.getElementById("costRange"),
    generateBtn: document.getElementById("generateBtn"),
    searchInput: document.getElementById("searchInput"),
    domainFilter: document.getElementById("domainFilter"),
    themeFilter: document.getElementById("themeFilter"),
    deliveryModelFilter: document.getElementById("deliveryModelFilter"),
    presetSelect: document.getElementById("presetSelect"),
    offerVariantInput: document.getElementById("offerVariantInput"),
    dailyRateInput: document.getElementById("dailyRateInput"),
    teamRoleInput: document.getElementById("teamRoleInput"),
    customerInput: document.getElementById("customerInput"),
    providerInput: document.getElementById("providerInput"),
    toast: document.getElementById("toast"),
    successModal: document.getElementById("successModal"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    modalMessage: document.getElementById("modalMessage"),
  };

  let isGenerating = false;
  let toastTimer = null;

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalize(value) {
    return String(value || "").toLowerCase();
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function moduleMap() {
    return new Map(state.modules.map((module) => [module.id, module]));
  }

  function getEstimate(module) {
    const estimate = module.estimate || {};
    return {
      unit: estimate.unit || "PT",
      min: Number(estimate.min || 0),
      likely: Number(estimate.likely || 0),
      max: Number(estimate.max || 0),
    };
  }

  function getSelectedModules() {
    return state.modules.filter((module) => state.selectedIds.has(module.id));
  }

  function getActiveModule() {
    if (state.activeId) {
      const fromActive = state.modules.find((module) => module.id === state.activeId);
      if (fromActive) {
        return fromActive;
      }
    }
    const firstSelectedId = state.selectedIds.values().next().value;
    if (firstSelectedId) {
      const fromSelected = state.modules.find((module) => module.id === firstSelectedId);
      if (fromSelected) {
        return fromSelected;
      }
    }
    return state.modules[0] || null;
  }

  function showToast(message) {
    if (!el.toast) {
      return;
    }
    el.toast.textContent = message;
    el.toast.classList.remove("hidden");
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
      el.toast.classList.add("hidden");
    }, 4500);
  }

  function showSuccessModal() {
    if (!el.successModal || !el.modalMessage) {
      return;
    }
    el.modalMessage.textContent = "Bitte an den VB senden und besprechen";
    el.successModal.classList.remove("hidden");
  }

  function hideSuccessModal() {
    if (!el.successModal) {
      return;
    }
    el.successModal.classList.add("hidden");
  }

  function ensureList(values) {
    return Array.isArray(values) && values.length ? values : ["–"];
  }

  function renderDetailsHtml(module) {
    const mod = module || {};
    const title = mod.title || mod.titel || "Unbenannter Leistungsschein";
    const id = mod.id || "LS-????";
    const summary = mod.summary || "–";
    const domain = mod.domain || mod.category || "–";
    const theme = mod.theme || "–";
    const deliveryModel = mod.delivery_model || "–";
    const estimate = getEstimate(mod);
    const intro = mod.intro || mod.einleitung || "–";
    const scope = mod.scope && typeof mod.scope === "object" ? mod.scope : {};
    const qty = scope.qty && typeof scope.qty === "object" ? scope.qty : {};
    const services = ensureList(mod.services || mod.leistungen);
    const deliverables = ensureList(mod.deliverables || mod.liefergegenstaende);
    const assumptions = ensureList(mod.assumptions || mod.annahmen);
    const constraints = ensureList(mod.constraints || mod.limitations || mod.einschraenkungen);
    const outOfScope = ensureList(mod.out_of_scope || mod.outOfScope || mod.nicht_im_leistungsumfang);
    const acceptance = ensureList(mod.acceptance || mod.abnahme || mod.abnahmekriterien);
    const boundaries = ensureList(scope.boundaries);
    const effortDrivers = ensureList(mod.effort_drivers);
    const risks = ensureList(mod.risks);
    const mitigations = ensureList(mod.mitigations);
    const changeControl = mod.change_control || "–";

    const listBlock = (label, items) => `
      <h4>${escapeHtml(label)}</h4>
      <ul class="detail-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    `;

    const qtyParts = [];
    ["shares", "tb", "users", "files_million"].forEach((key) => {
      const value = qty[key];
      if (value !== null && value !== undefined && value !== "") {
        qtyParts.push(`${key}: ${value}`);
      }
    });
    const qtyText = qtyParts.length ? qtyParts.join(" | ") : "–";

    return `
      <h3>${escapeHtml(id)} - ${escapeHtml(title)}</h3>
      <p>${escapeHtml(summary)}</p>
      <p><strong>Domain:</strong> ${escapeHtml(domain)} | <strong>Theme:</strong> ${escapeHtml(theme)}</p>
      <p><strong>Delivery Model:</strong> ${escapeHtml(deliveryModel)}</p>
      <p><strong>Aufwand:</strong> ${estimate.min} / ${estimate.likely} / ${estimate.max} ${escapeHtml(estimate.unit)} (min/likely/max)</p>
      <p><strong>Intro:</strong> ${escapeHtml(intro)}</p>
      <p><strong>Scope:</strong> ${escapeHtml(scope.description || "–")}</p>
      <p><strong>Scope Qty:</strong> ${escapeHtml(qtyText)}</p>
      ${listBlock("Scope Boundaries", boundaries)}
      ${listBlock("Leistungen", services)}
      ${listBlock("Liefergegenstaende", deliverables)}
      ${listBlock("Annahmen", assumptions)}
      ${listBlock("Constraints", constraints)}
      ${listBlock("Out of Scope", outOfScope)}
      ${listBlock("Abnahmekriterien", acceptance)}
      ${listBlock("Aufwandstreiber", effortDrivers)}
      ${listBlock("Risiken", risks)}
      ${listBlock("Massnahmen", mitigations)}
      <h4>Change-Control</h4>
      <p>${escapeHtml(changeControl)}</p>
    `;
  }

  function openDetailModal(html, title = "Leistungsschein Details") {
    if (!el.detailBackdrop || !el.detailModalBody) {
      return;
    }
    if (el.detailModalTitle) {
      el.detailModalTitle.textContent = title;
    }
    el.detailModalBody.innerHTML = html;
    el.detailBackdrop.classList.remove("hidden");
  }

  function closeDetailModal() {
    if (!el.detailBackdrop) {
      return;
    }
    el.detailBackdrop.classList.add("hidden");
  }

  function getFilteredModules() {
    const term = normalize(state.searchTerm).trim();
    return state.modules.filter((module) => {
      if (state.domain && module.domain !== state.domain) {
        return false;
      }
      if (state.theme && module.theme !== state.theme) {
        return false;
      }
      if (state.deliveryModel && module.delivery_model !== state.deliveryModel) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [
        module.id,
        module.title,
        module.summary,
        module.domain,
        module.theme,
        module.delivery_model,
        ...(Array.isArray(module.tags) ? module.tags : []),
      ].join(" ");
      return normalize(haystack).includes(term);
    });
  }

  function getMissingDependencies() {
    const missing = [];
    const selected = new Set(state.selectedIds);
    getSelectedModules().forEach((module) => {
      const requires = Array.isArray(module.dependencies?.requires) ? module.dependencies.requires : [];
      requires.forEach((requiredId) => {
        if (!selected.has(requiredId)) {
          missing.push(`${module.id} benoetigt ${requiredId}`);
        }
      });
    });
    return [...new Set(missing)];
  }

  function getSelectionConflicts() {
    const selected = new Set(state.selectedIds);
    const byId = moduleMap();
    const conflicts = [];
    getSelectedModules().forEach((module) => {
      const excludes = Array.isArray(module.dependencies?.excludes) ? module.dependencies.excludes : [];
      excludes.forEach((excludedId) => {
        if (selected.has(excludedId)) {
          conflicts.push(`${module.id} schliesst ${excludedId} aus`);
        }
      });
      if (!module.option_group) {
        return;
      }
      const sameGroup = getSelectedModules().filter((item) => item.option_group === module.option_group);
      if (sameGroup.length > 1) {
        conflicts.push(`Option-Gruppe ${module.option_group} mehrfach aktiv`);
      }
    });
    return [...new Set(conflicts)];
  }

  function calculateTotals() {
    return getSelectedModules().reduce(
      (acc, module) => {
        const estimate = getEstimate(module);
        return {
          unit: estimate.unit,
          min: acc.min + estimate.min,
          likely: acc.likely + estimate.likely,
          max: acc.max + estimate.max,
        };
      },
      { unit: "PT", min: 0, likely: 0, max: 0 }
    );
  }

  function autoSelectRequired(moduleId, selection, byId, messages, visited = new Set()) {
    if (visited.has(moduleId)) {
      return;
    }
    visited.add(moduleId);
    const module = byId.get(moduleId);
    const requires = Array.isArray(module?.dependencies?.requires) ? module.dependencies.requires : [];
    requires.forEach((requiredId) => {
      if (byId.has(requiredId) && !selection.has(requiredId)) {
        selection.add(requiredId);
        messages.push(`${requiredId} wurde automatisch mit ausgewaehlt (Abhaengigkeit von ${moduleId}).`);
      }
      autoSelectRequired(requiredId, selection, byId, messages, visited);
    });
  }

  function autoSelectRequirementsForSelection(selection, byId, messages) {
    Array.from(selection).forEach((id) => {
      autoSelectRequired(id, selection, byId, messages);
    });
  }

  function resolveExcludes(selection, byId, anchorId, messages) {
    const anchor = byId.get(anchorId);
    const anchorExcludes = Array.isArray(anchor?.dependencies?.excludes) ? anchor.dependencies.excludes : [];
    anchorExcludes.forEach((excludedId) => {
      if (selection.has(excludedId)) {
        selection.delete(excludedId);
        messages.push(`${excludedId} wurde automatisch abgewaehlt (inkompatibel mit ${anchorId}).`);
      }
    });
    Array.from(selection).forEach((selectedId) => {
      if (selectedId === anchorId) {
        return;
      }
      const selectedModule = byId.get(selectedId);
      const excludes = Array.isArray(selectedModule?.dependencies?.excludes)
        ? selectedModule.dependencies.excludes
        : [];
      if (excludes.includes(anchorId)) {
        selection.delete(selectedId);
        messages.push(`${selectedId} wurde automatisch abgewaehlt (inkompatibel mit ${anchorId}).`);
      }
    });
  }

  function resolveOptionGroup(selection, byId, anchorId, messages) {
    const anchor = byId.get(anchorId);
    if (!anchor?.option_group) {
      return;
    }
    Array.from(selection).forEach((selectedId) => {
      if (selectedId === anchorId) {
        return;
      }
      const module = byId.get(selectedId);
      if (module?.option_group === anchor.option_group) {
        selection.delete(selectedId);
        messages.push(`${selectedId} wurde abgewaehlt (Option-Gruppe ${anchor.option_group}).`);
      }
    });
  }

  function removeDependents(selection, byId, removedRootId, messages) {
    let changed = true;
    while (changed) {
      changed = false;
      Array.from(selection).forEach((id) => {
        const module = byId.get(id);
        const requires = Array.isArray(module?.dependencies?.requires) ? module.dependencies.requires : [];
        if (requires.includes(removedRootId) || requires.some((req) => !selection.has(req))) {
          selection.delete(id);
          messages.push(`${id} wurde entfernt, weil eine Abhaengigkeit fehlt.`);
          changed = true;
        }
      });
    }
  }

  function selectModuleWithRules(moduleId) {
    const byId = moduleMap();
    const selection = new Set(state.selectedIds);
    const messages = [];
    selection.add(moduleId);
    autoSelectRequired(moduleId, selection, byId, messages);
    resolveExcludes(selection, byId, moduleId, messages);
    resolveOptionGroup(selection, byId, moduleId, messages);
    autoSelectRequirementsForSelection(selection, byId, messages);
    state.selectedIds = selection;
    if (messages.length > 0) {
      showToast(messages[0]);
    }
  }

  function deselectModuleWithRules(moduleId) {
    const byId = moduleMap();
    const selection = new Set(state.selectedIds);
    const messages = [];
    selection.delete(moduleId);
    removeDependents(selection, byId, moduleId, messages);
    state.selectedIds = selection;
    if (messages.length > 0) {
      showToast(messages[0]);
    }
  }

  function renderDomainFilter() {
    const domains = [...new Set(state.modules.map((module) => module.domain))].sort();
    const options = ['<option value="">Alle Domains</option>'].concat(
      domains.map((domain) => `<option value="${escapeHtml(domain)}">${escapeHtml(domain)}</option>`)
    );
    el.domainFilter.innerHTML = options.join("");
    el.domainFilter.value = state.domain;
  }

  function renderThemeFilter() {
    const themes = [
      ...new Set(
        state.modules
          .filter((module) => !state.domain || module.domain === state.domain)
          .map((module) => module.theme)
      ),
    ].sort();
    const options = ['<option value="">Alle Themes</option>'].concat(
      themes.map((theme) => `<option value="${escapeHtml(theme)}">${escapeHtml(theme)}</option>`)
    );
    el.themeFilter.innerHTML = options.join("");
    if (state.theme && themes.includes(state.theme)) {
      el.themeFilter.value = state.theme;
    } else {
      state.theme = "";
      el.themeFilter.value = "";
    }
  }

  function renderPresetOptions() {
    const byCategory = new Map();
    state.offers.forEach((offer) => {
      const categoryId = offer.category || "general";
      const categoryTitle = offer.category_title || categoryId;
      if (!byCategory.has(categoryId)) {
        byCategory.set(categoryId, {
          id: categoryId,
          title: categoryTitle,
          offers: [],
        });
      }
      byCategory.get(categoryId).offers.push(offer);
    });

    const grouped = Array.from(byCategory.values()).sort((a, b) => a.title.localeCompare(b.title));
    const options = ['<option value="">Vorlage waehlen</option>'];
    grouped.forEach((group) => {
      const children = group.offers
        .map(
          (offer) =>
            `<option value="${escapeHtml(offer.id)}">${escapeHtml(
              offer.title || offer.name || offer.id
            )} - ${escapeHtml(offer.description || "")}</option>`
        )
        .join("");
      options.push(`<optgroup label="${escapeHtml(group.title)}">${children}</optgroup>`);
    });

    el.presetSelect.innerHTML = options.join("");
    el.presetSelect.value = state.selectedPreset;
  }

  function renderTaxonomyTree() {
    if (!Array.isArray(state.taxonomy) || state.taxonomy.length === 0) {
      el.taxonomyTree.innerHTML = "<p>Keine Taxonomie verfuegbar.</p>";
      return;
    }
    el.taxonomyTree.innerHTML = state.taxonomy
      .map(
        (domainEntry) => `
        <div class="tree-domain">
          <button data-tree-domain="${escapeHtml(domainEntry.domain)}">${escapeHtml(domainEntry.domain)} (${domainEntry.count})</button>
          <div class="tree-theme">
            ${domainEntry.themes
              .map(
                (themeEntry) =>
                  `<button data-tree-domain="${escapeHtml(domainEntry.domain)}" data-tree-theme="${escapeHtml(
                    themeEntry.theme
                  )}">${escapeHtml(themeEntry.theme)} (${themeEntry.count})</button>`
              )
              .join("")}
          </div>
        </div>`
      )
      .join("");
    el.taxonomyTree.querySelectorAll("button[data-tree-domain]").forEach((button) => {
      button.addEventListener("click", () => {
        state.domain = button.getAttribute("data-tree-domain") || "";
        state.theme = button.getAttribute("data-tree-theme") || "";
        el.domainFilter.value = state.domain;
        renderThemeFilter();
        el.themeFilter.value = state.theme || "";
        renderModules();
      });
    });
  }

  function cardTemplate(module) {
    const checked = state.selectedIds.has(module.id) ? "checked" : "";
    const estimate = getEstimate(module);
    const tags = Array.isArray(module.tags) ? module.tags : [];
    return `
      <article class="card" data-id="${escapeHtml(module.id)}">
        <h3>${escapeHtml(module.id)} - ${escapeHtml(module.title)}</h3>
        <div>
          <span class="chip">${escapeHtml(module.domain)}</span>
          <span class="chip">${escapeHtml(module.theme)}</span>
          ${
            module.delivery_model
              ? `<span class="chip">${escapeHtml(module.delivery_model)}</span>`
              : ""
          }
        </div>
        <p>${escapeHtml(module.summary)}</p>
        <p class="estimate">Aufwand: ${estimate.min}-${estimate.max} ${escapeHtml(estimate.unit)} (likely ${
      estimate.likely
    } ${escapeHtml(estimate.unit)})</p>
        <div class="tags">
          ${(tags.length ? tags : ["keine Tags"]).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="card-controls">
          <label>
            <input type="checkbox" data-module-id="${escapeHtml(module.id)}" ${checked} />
            Auswaehlen
          </label>
          <button type="button" data-detail-id="${escapeHtml(module.id)}">Details</button>
        </div>
      </article>
    `;
  }

  function renderModules() {
    const filtered = getFilteredModules();
    if (!filtered.length) {
      el.moduleGrid.innerHTML = '<div class="error">Keine Leistungsscheine fuer den aktuellen Filter gefunden.</div>';
      return;
    }
    el.moduleGrid.innerHTML = filtered.map(cardTemplate).join("");
    el.moduleGrid.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
      checkbox.addEventListener("change", (event) => {
        const moduleId = event.target.getAttribute("data-module-id");
        if (!moduleId) {
          return;
        }
        if (event.target.checked) {
          selectModuleWithRules(moduleId);
        } else {
          deselectModuleWithRules(moduleId);
        }
        state.selectedPreset = "";
        el.presetSelect.value = "";
        renderModules();
        renderSidebar();
      });
    });
    el.moduleGrid.querySelectorAll("article.card[data-id]").forEach((card) => {
      card.addEventListener("click", (event) => {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          (target.matches("button[data-detail-id]") ||
            target.matches("input[type='checkbox']") ||
            target.closest("button[data-detail-id]") ||
            target.closest("input[type='checkbox']"))
        ) {
          return;
        }
        const cardId = card.getAttribute("data-id");
        if (cardId) {
          state.activeId = cardId;
        }
      });
    });
    el.moduleGrid.querySelectorAll("button[data-detail-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const moduleId = button.getAttribute("data-detail-id") || "";
        if (!moduleId) {
          return;
        }
        state.activeId = moduleId;
        const module = state.modules.find((item) => item.id === moduleId);
        if (!module) {
          return;
        }
        const title = `${module.id || "LS-????"} - ${module.title || module.titel || "Leistungsschein"}`;
        openDetailModal(renderDetailsHtml(module), title);
      });
    });
  }

  function renderSidebar() {
    el.selectionCount.textContent = String(state.selectedIds.size);
    const selected = Array.from(state.selectedIds).sort();
    el.selectedIds.innerHTML = selected.length
      ? selected.map((id) => `<li>${escapeHtml(id)}</li>`).join("")
      : "<li>Keine</li>";

    const missing = getMissingDependencies();
    el.missingDependencies.innerHTML = missing.length
      ? missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>Keine</li>";

    const conflicts = getSelectionConflicts();
    el.selectionConflicts.innerHTML = conflicts.length
      ? conflicts.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>Keine</li>";

    const totals = calculateTotals();
    el.ptRange.textContent = `${totals.min}-${totals.max} ${totals.unit}`;
    el.ptLikely.textContent = `Most likely: ${totals.likely} ${totals.unit}`;

    const rate = Number(el.dailyRateInput.value);
    if (Number.isFinite(rate) && rate > 0) {
      el.costRange.textContent = `Kostenrahmen: ${formatMoney(totals.min * rate)} - ${formatMoney(
        totals.max * rate
      )} (unverbindlicher Richtwert)`;
    } else {
      el.costRange.textContent = "Kostenrahmen: - (Tagessatz optional)";
    }

    el.generateBtn.disabled = state.selectedIds.size === 0 || isGenerating;
  }

  function applyPreset(presetId) {
    const preset = state.offers.find((item) => item.id === presetId);
    if (!preset) {
      state.selectedPreset = "";
      state.selectedIds = new Set();
      renderModules();
      renderSidebar();
      return;
    }
    const byId = moduleMap();
    const presetIds = Array.isArray(preset.module_ids)
      ? preset.module_ids
      : Array.isArray(preset.defaultSelected)
        ? preset.defaultSelected
        : [];
    const selection = new Set(presetIds.filter((id) => byId.has(id)));
    const messages = [];
    Array.from(selection).forEach((id) => {
      autoSelectRequired(id, selection, byId, messages);
      resolveExcludes(selection, byId, id, messages);
      resolveOptionGroup(selection, byId, id, messages);
    });
    autoSelectRequirementsForSelection(selection, byId, messages);

    state.selectedPreset = preset.id;
    state.selectedIds = selection;
    if (preset.defaults?.offerVariant) {
      el.offerVariantInput.value = preset.defaults.offerVariant;
    }
    renderModules();
    renderSidebar();
    showToast(`Vorlage ${preset.title || preset.name || preset.id} geladen.`);
  }

  async function loadData() {
    try {
      const [modulesResponse, offersResponse, taxonomyResponse] = await Promise.all([
        fetch("/api/modules"),
        fetch("/api/offers"),
        fetch("/api/taxonomy"),
      ]);
      if (!modulesResponse.ok || !offersResponse.ok || !taxonomyResponse.ok) {
        throw new Error("Mindestens ein API-Endpunkt ist nicht erreichbar.");
      }

      const [modules, offers, taxonomy] = await Promise.all([
        modulesResponse.json(),
        offersResponse.json(),
        taxonomyResponse.json(),
      ]);
      if (!Array.isArray(modules) || !Array.isArray(offers) || !Array.isArray(taxonomy)) {
        throw new Error("Unerwartetes API-Format.");
      }

      state.modules = modules;
      state.offers = offers;
      state.taxonomy = taxonomy;
      state.selectedIds = new Set();

      renderDomainFilter();
      renderThemeFilter();
      renderPresetOptions();
      renderTaxonomyTree();
      renderModules();
      renderSidebar();
    } catch (error) {
      el.moduleGrid.innerHTML = `<div class="error">${escapeHtml(error.message || "Daten konnten nicht geladen werden.")}</div>`;
      showToast(error.message || "Daten konnten nicht geladen werden.");
    }
  }

  async function generateOffer() {
    if (isGenerating) {
      return;
    }
    const selectedModuleIds = Array.from(state.selectedIds);
    if (!selectedModuleIds.length) {
      showToast("Bitte mindestens einen Leistungsschein auswaehlen.");
      return;
    }

    const rate = Number(el.dailyRateInput.value);
    const payload = {
      selectedModuleIds,
      offerVariant: el.offerVariantInput.value || "Individuell",
      teamRole: el.teamRoleInput.value || "",
      customer: el.customerInput.value || "<<Kundenname>>",
      provider: el.providerInput.value || "<<Firmenname>>",
      date: new Date().toISOString().slice(0, 10),
    };
    if (Number.isFinite(rate) && rate > 0) {
      payload.ratePerDay = rate;
    }

    isGenerating = true;
    el.generateBtn.textContent = "Generiere...";
    renderSidebar();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let message = `Generierung fehlgeschlagen (${response.status})`;
        try {
          const errorBody = await response.json();
          if (errorBody?.message) {
            message = errorBody.message;
          }
        } catch (_error) {
          // fallback message
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
      const filename = filenameMatch?.[1] || "Angebot.docx";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showSuccessModal();
    } finally {
      isGenerating = false;
      el.generateBtn.textContent = "Angebot generieren";
      renderSidebar();
    }
  }

  el.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value || "";
    renderModules();
  });

  el.domainFilter.addEventListener("change", (event) => {
    state.domain = event.target.value || "";
    state.theme = "";
    renderThemeFilter();
    renderModules();
  });

  el.themeFilter.addEventListener("change", (event) => {
    state.theme = event.target.value || "";
    renderModules();
  });

  el.deliveryModelFilter.addEventListener("change", (event) => {
    state.deliveryModel = event.target.value || "";
    renderModules();
  });

  el.presetSelect.addEventListener("change", (event) => {
    applyPreset(event.target.value || "");
  });

  el.dailyRateInput.addEventListener("input", () => {
    renderSidebar();
  });

  el.generateBtn.addEventListener("click", () => {
    generateOffer().catch((error) => {
      showToast(error.message || "Angebot konnte nicht generiert werden.");
    });
  });

  el.detailsBtn?.addEventListener("click", () => {
    const module = getActiveModule();
    if (!module) {
      showToast("Keine Leistungsscheine verfuegbar.");
      return;
    }
    state.activeId = module.id || "";
    const title = `${module.id || "LS-????"} - ${module.title || module.titel || "Leistungsschein"}`;
    openDetailModal(renderDetailsHtml(module), title);
  });

  el.closeModalBtn?.addEventListener("click", () => {
    hideSuccessModal();
  });

  el.successModal?.addEventListener("click", (event) => {
    if (event.target === el.successModal) {
      hideSuccessModal();
    }
  });

  el.closeDetailModalBtn?.addEventListener("click", () => {
    closeDetailModal();
  });

  el.detailBackdrop?.addEventListener("click", (event) => {
    if (event.target === el.detailBackdrop) {
      closeDetailModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && el.detailBackdrop && !el.detailBackdrop.classList.contains("hidden")) {
      closeDetailModal();
    }
  });

  loadData();

  window.__detailModalApi = {
    openDetailModal,
    closeDetailModal,
    renderDetailsHtml,
    getActiveModule,
  };
})();
