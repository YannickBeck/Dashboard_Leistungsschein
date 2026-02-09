const { spawn, spawnSync } = require("child_process");

const port = Number(process.env.PRESET_CHECK_PORT || 3102);
const presetId = process.env.PRESET_ID || "onprem_files_to_azurefiles_standard";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      if (health.ok) {
        return true;
      }
    } catch (_error) {
      // retry
    }
    await sleep(300);
  }
  return false;
}

async function main() {
  const child = spawn(process.execPath, ["server.js"], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "ignore", "ignore"]
  });

  try {
    const up = await waitForServer();
    if (!up) {
      throw new Error("Serverstart fehlgeschlagen.");
    }

    const [offersRes, modulesRes] = await Promise.all([
      fetch(`http://127.0.0.1:${port}/api/offers`),
      fetch(`http://127.0.0.1:${port}/api/modules`)
    ]);
    const offers = await offersRes.json();
    const modules = await modulesRes.json();
    if (!Array.isArray(offers) || !Array.isArray(modules)) {
      throw new Error("API-Format fuer Offers/Modules ist ungueltig.");
    }

    const moduleIds = new Set(modules.map((item) => String(item.id || "")));
    const preset = offers.find((item) => item.id === presetId);
    if (!preset) {
      throw new Error(`Preset ${presetId} nicht gefunden.`);
    }
    if (preset.category !== "onprem-migrationen") {
      throw new Error(`Preset-Kategorie ungueltig: ${preset.category}`);
    }

    const ids = Array.isArray(preset.module_ids)
      ? preset.module_ids
      : Array.isArray(preset.defaultSelected)
        ? preset.defaultSelected
        : [];
    const validIds = ids.filter((id) => moduleIds.has(id));
    if (validIds.length === 0) {
      throw new Error(`Preset ${presetId} hat keine gueltigen Modul-IDs.`);
    }

    const generateRes = await fetch(`http://127.0.0.1:${port}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        selectedModuleIds: validIds.slice(0, 8),
        customer: "Preset Testkunde",
        provider: "Preset Testprovider",
        date: "2026-02-07"
      })
    });
    if (!generateRes.ok) {
      throw new Error(`Generate fehlgeschlagen: HTTP ${generateRes.status}`);
    }
    const bytes = Buffer.from(await generateRes.arrayBuffer()).length;
    if (bytes < 3000) {
      throw new Error(`DOCX zu klein (${bytes} bytes).`);
    }

    console.log(`PRESET_CHECK_OK preset=${presetId} matchedIds=${validIds.length} docxBytes=${bytes}`);
  } finally {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  }
}

main().catch((error) => {
  console.error(`PRESET_CHECK_FAIL ${error.message}`);
  process.exit(1);
});
