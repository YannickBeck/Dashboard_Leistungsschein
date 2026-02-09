const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  const appJs = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");

  const modules = [
    {
      id: "LS-9001",
      title: "Alpha Modul",
      domain: "storage",
      theme: "alpha",
      summary: "Alpha Summary",
      tags: ["Azure", "Storage", "Alpha"],
      estimate: { unit: "PT", min: 2, likely: 3, max: 5 },
      intro: "Alpha Intro. Satz zwei.",
      services: ["S1", "S2", "S3", "S4", "S5", "S6"],
      deliverables: ["D1", "D2", "D3", "D4"],
      assumptions: ["A1", "A2", "A3"],
      constraints: ["C1", "C2", "C3"],
      out_of_scope: ["O1", "O2", "O3"],
      acceptance: ["AC1", "AC2", "AC3"],
      scope: {
        description: "Alpha Scope",
        qty: { shares: 4, tb: 2 },
        boundaries: ["B1", "B2", "B3"]
      },
      effort_drivers: ["E1", "E2", "E3"],
      risks: ["R1", "R2", "R3"],
      mitigations: ["M1", "M2", "M3"],
      change_control: "CC Alpha",
      dependencies: { requires: [], excludes: [] }
    },
    {
      id: "LS-9002",
      title: "Beta Modul",
      domain: "network",
      theme: "beta",
      summary: "Beta Summary",
      tags: ["Azure", "Network", "Beta"],
      estimate: { unit: "PT", min: 1, likely: 2, max: 4 },
      intro: "Beta Intro. Satz zwei.",
      services: ["S1", "S2", "S3", "S4", "S5", "S6"],
      deliverables: ["D1", "D2", "D3", "D4"],
      assumptions: ["A1", "A2", "A3"],
      constraints: ["C1", "C2", "C3"],
      out_of_scope: ["O1", "O2", "O3"],
      acceptance: ["AC1", "AC2", "AC3"],
      scope: {
        description: "Beta Scope",
        qty: { users: 120 },
        boundaries: ["B1", "B2", "B3"]
      },
      effort_drivers: ["E1", "E2", "E3"],
      risks: ["R1", "R2", "R3"],
      mitigations: ["M1", "M2", "M3"],
      change_control: "CC Beta",
      dependencies: { requires: [], excludes: [] }
    }
  ];

  const dom = new JSDOM(html, {
    url: "http://localhost:3000/",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;

  window.fetch = async (url) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/api/modules")) {
      return { ok: true, json: async () => modules };
    }
    if (endpoint.endsWith("/api/offers")) {
      return { ok: true, json: async () => [] };
    }
    if (endpoint.endsWith("/api/taxonomy")) {
      return {
        ok: true,
        json: async () => [
          { domain: "network", count: 1, themes: [{ theme: "beta", count: 1 }] },
          { domain: "storage", count: 1, themes: [{ theme: "alpha", count: 1 }] }
        ]
      };
    }
    throw new Error(`Unexpected URL ${endpoint}`);
  };

  window.eval(appJs);
  await wait(50);

  const cards = document.querySelectorAll("article.card");
  assert(cards.length === 2, "Cards wurden nicht gerendert.");

  const detailsBtn = document.getElementById("detailsBtn");
  const backdrop = document.getElementById("detailBackdrop");
  const title = document.getElementById("detailModalTitle");
  const body = document.getElementById("detailModalBody");

  cards[1].dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  detailsBtn.click();
  await wait(0);

  assert(!backdrop.classList.contains("hidden"), "Detail-Modal oeffnet nicht.");
  assert((title.textContent || "").includes("LS-9002"), "Aktives Modul wird nicht bevorzugt.");
  const bodyText = body.textContent || "";
  assert(bodyText.includes("Beta Scope"), "Scope fehlt im Detail-Modal.");
  assert(bodyText.includes("Aufwandstreiber"), "Effort Drivers fehlen im Detail-Modal.");
  assert(bodyText.includes("Risiken"), "Risiken fehlen im Detail-Modal.");
  assert(bodyText.includes("Change-Control"), "Change-Control fehlt im Detail-Modal.");

  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(0);
  assert(backdrop.classList.contains("hidden"), "ESC schliesst Modal nicht.");

  console.log("UI_MODAL_CHECK_OK");
}

main().catch((error) => {
  console.error(`UI_MODAL_CHECK_FAIL ${error.message}`);
  process.exit(1);
});
