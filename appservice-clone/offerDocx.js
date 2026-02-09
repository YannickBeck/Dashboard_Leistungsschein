const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} = require("docx");

function paragraph(text, options = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: Boolean(options.bold),
        size: options.size || 22,
      }),
    ],
    heading: options.heading || undefined,
    spacing: { after: options.after || 120 },
    alignment: options.align || undefined,
    bullet: options.bullet ? { level: 0 } : undefined,
  });
}

function tableCellText(text, bold = false) {
  return new TableCell({
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "D6DCE3" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "D6DCE3" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "D6DCE3" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "D6DCE3" },
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text),
            bold,
            size: 22,
          }),
        ],
      }),
    ],
  });
}

function normalizeEstimate(module) {
  const estimate = module.estimate || {};
  return {
    unit: estimate.unit || "PT",
    min: Number(estimate.min || 0),
    likely: Number(estimate.likely || 0),
    max: Number(estimate.max || 0),
  };
}

function formatMoney(amount) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildOverviewTable(modules) {
  const rows = [
    new TableRow({
      children: [
        tableCellText("ID", true),
        tableCellText("Titel", true),
        tableCellText("Domain / Theme", true),
        tableCellText("Aufwand (PT)", true),
      ],
    }),
  ];

  modules.forEach((module) => {
    const estimate = normalizeEstimate(module);
    rows.push(
      new TableRow({
        children: [
          tableCellText(module.id),
          tableCellText(module.title),
          tableCellText(`${module.domain || "-"} / ${module.theme || "-"}`),
          tableCellText(`${estimate.min}-${estimate.max} (likely ${estimate.likely})`),
        ],
      })
    );
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function buildEstimationTable(modules) {
  const rows = [
    new TableRow({
      children: [
        tableCellText("LS-ID", true),
        tableCellText("Titel", true),
        tableCellText("Aufwand min/likely/max (PT)", true),
        tableCellText("Hinweise / Annahmen", true),
      ],
    }),
  ];

  modules.forEach((module) => {
    const estimate = normalizeEstimate(module);
    const assumptions = Array.isArray(module.assumptions) ? module.assumptions : [];
    const drivers = Array.isArray(module.effort_drivers) ? module.effort_drivers : [];
    const assumptionHint = assumptions.slice(0, 2).join("; ");
    const driverHint = drivers.slice(0, 2).join("; ");
    const hintParts = [];
    if (assumptionHint) {
      hintParts.push(`Annahmen: ${assumptionHint}`);
    }
    if (driverHint) {
      hintParts.push(`Treiber: ${driverHint}`);
    }
    const hint = hintParts.length ? hintParts.join(" | ") : "-";
    rows.push(
      new TableRow({
        children: [
          tableCellText(module.id),
          tableCellText(module.title),
          tableCellText(`${estimate.min} / ${estimate.likely} / ${estimate.max}`),
          tableCellText(hint),
        ],
      })
    );
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function pushBulletSection(parts, title, values) {
  parts.push(paragraph(title, { heading: HeadingLevel.HEADING_3, bold: true }));
  const list = Array.isArray(values) ? values : [];
  if (list.length === 0) {
    parts.push(paragraph("-", { bullet: true }));
    return;
  }
  list.forEach((item) => {
    parts.push(paragraph(item, { bullet: true }));
  });
}

function buildModuleSection(module) {
  const parts = [];
  const scope = module.scope && typeof module.scope === "object" ? module.scope : {};
  const scopeQty = scope.qty && typeof scope.qty === "object" ? scope.qty : {};
  const risks = Array.isArray(module.risks) ? module.risks : [];
  const mitigations = Array.isArray(module.mitigations) ? module.mitigations : [];
  const customerResponsibilities = Array.isArray(module.customer_responsibilities)
    ? module.customer_responsibilities
    : [];
  const providerResponsibilities = Array.isArray(module.provider_responsibilities)
    ? module.provider_responsibilities
    : [];
  const raciCustomer = Array.isArray(module.raci?.customer) ? module.raci.customer : [];
  const raciProvider = Array.isArray(module.raci?.provider) ? module.raci.provider : [];
  const effortDrivers = Array.isArray(module.effort_drivers) ? module.effort_drivers : [];
  const qtyValues = Object.entries(scopeQty)
    .filter((entry) => entry[1] !== null && entry[1] !== undefined && entry[1] !== "")
    .map((entry) => `${entry[0]}: ${entry[1]}`);

  parts.push(paragraph(`${module.id} - ${module.title}`, { heading: HeadingLevel.HEADING_2, bold: true, size: 26 }));
  parts.push(paragraph(module.summary || "-"));
  parts.push(paragraph("Einleitung", { heading: HeadingLevel.HEADING_3, bold: true }));
  parts.push(paragraph(module.intro || "-"));
  parts.push(paragraph("Scope & Boundaries", { heading: HeadingLevel.HEADING_3, bold: true }));
  parts.push(paragraph(scope.description || "-"));
  parts.push(paragraph(`Scope-Mengen: ${qtyValues.length ? qtyValues.join(", ") : "-"}`));
  pushBulletSection(parts, "Scope-Grenzen", scope.boundaries);

  pushBulletSection(parts, "Leistungen", module.services);
  pushBulletSection(parts, "Liefergegenstaende", module.deliverables);
  pushBulletSection(parts, "Annahmen", module.assumptions);
  pushBulletSection(parts, "Einschraenkungen", module.constraints);
  pushBulletSection(parts, "Nicht im Leistungsumfang", module.out_of_scope);
  pushBulletSection(parts, "Abnahmekriterien", module.acceptance);
  pushBulletSection(parts, "Aufwandstreiber", effortDrivers);
  pushBulletSection(parts, "Risiken", risks);
  pushBulletSection(parts, "Massnahmen", mitigations);
  pushBulletSection(parts, "Mitwirkung Kunde", customerResponsibilities);
  pushBulletSection(parts, "Mitwirkung Dienstleister", providerResponsibilities);
  pushBulletSection(parts, "RACI Kunde", raciCustomer);
  pushBulletSection(parts, "RACI Dienstleister", raciProvider);
  parts.push(paragraph("Change-Control", { heading: HeadingLevel.HEADING_3, bold: true }));
  parts.push(paragraph(module.change_control || "-"));

  return parts;
}

function buildTotals(modules) {
  return modules.reduce(
    (acc, module) => {
      const estimate = normalizeEstimate(module);
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

async function buildOfferDocx({ meta, modules }) {
  const children = [];
  const totals = meta?.totals || buildTotals(modules);
  const ratePerDay = Number(meta?.ratePerDay);

  children.push(
    paragraph("Angebot - Migration Netzwerklaufwerke nach Azure Storage", {
      heading: HeadingLevel.HEADING_1,
      bold: true,
      size: 34,
      align: AlignmentType.CENTER,
      after: 220,
    })
  );
  children.push(paragraph(`Kunde: ${meta.customer}`));
  children.push(paragraph(`Projekt: ${meta.projectName}`));
  children.push(paragraph(`Version: ${meta.version} | Datum: ${meta.date}`));
  children.push(paragraph(`Anbieter: ${meta.provider}`));
  children.push(paragraph(`Leistungsmodell: ${meta.deliveryModel || "T&M / Aufwandsschaetzung"}`));
  children.push(paragraph(`Angebotsvariante: ${meta.offerVariant || "Individuell"}`));
  if (meta.teamRole) {
    children.push(paragraph(`Teamrolle: ${meta.teamRole}`));
  }
  children.push(paragraph(""));

  children.push(paragraph("Management Summary", { heading: HeadingLevel.HEADING_2, bold: true, size: 28 }));
  children.push(
    paragraph(
      `Ausgewaehlt wurden ${modules.length} Leistungsscheine aus dem Baukasten. Das Angebot basiert auf Aufwandsschaetzungen (PT-Ranges) und dient als unverbindlicher Orientierungsrahmen fuer Presales und Scope-Abstimmung.`
    )
  );
  children.push(
    paragraph(
      "Die finale Umsetzung und der konkrete Aufwand haengen von Annahmen, technischen Rahmenbedingungen, Abhaengigkeiten und Kundenentscheidungen ab."
    )
  );
  children.push(paragraph(""));

  children.push(paragraph("Leistungsuebersicht", { heading: HeadingLevel.HEADING_2, bold: true, size: 28 }));
  children.push(buildOverviewTable(modules));
  children.push(paragraph(""));

  children.push(
    paragraph("Aufwandsschaetzung & Kostenrahmen (unverbindlich)", {
      heading: HeadingLevel.HEADING_2,
      bold: true,
      size: 28,
    })
  );
  children.push(buildEstimationTable(modules));
  children.push(
    paragraph(
      `Gesamtsumme Aufwand: min ${totals.min} ${totals.unit}, likely ${totals.likely} ${totals.unit}, max ${totals.max} ${totals.unit}.`,
      { bold: true }
    )
  );
  if (Number.isFinite(ratePerDay) && ratePerDay > 0) {
    children.push(
      paragraph(
        `Kostenrahmen (unverbindlicher Richtwert): ${formatMoney(totals.min * ratePerDay)} bis ${formatMoney(
          totals.max * ratePerDay
        )} bei Tagessatz ${formatMoney(ratePerDay)}.`
      )
    );
  } else {
    children.push(paragraph("Kostenrahmen: Kein Tagessatz angegeben, daher nur Aufwandsschaetzung in PT."));
  }
  children.push(
    paragraph(
      "Disclaimer: Diese Angaben sind eine Aufwandsschaetzung und kein Festpreis. Der finale Aufwand haengt von Annahmen, Scope, Mengentreibern und Abhaengigkeiten ab."
    )
  );
  children.push(paragraph(""));

  children.push(paragraph("Leistungsscheine (Details)", { heading: HeadingLevel.HEADING_2, bold: true, size: 28 }));
  modules.forEach((module) => {
    children.push(...buildModuleSection(module));
  });

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22,
          },
        },
      },
    },
  });

  return Packer.toBuffer(doc);
}

module.exports = {
  buildOfferDocx,
};
