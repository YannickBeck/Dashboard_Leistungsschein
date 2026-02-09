const { spawn, spawnSync } = require("child_process");

const port = Number(process.env.GEN_CHECK_PORT || 3101);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (response.ok) {
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
      throw new Error("Server startet nicht rechtzeitig.");
    }

    const modulesRes = await fetch(`http://127.0.0.1:${port}/api/modules`);
    const modules = await modulesRes.json();
    if (!Array.isArray(modules) || modules.length < 2) {
      throw new Error("Zu wenige Module fuer Generate-Check.");
    }

    const body = {
      selectedModuleIds: [modules[0].id, modules[1].id],
      customer: "Testkunde",
      provider: "Testprovider",
      date: "2026-02-07",
      ratePerDay: 1200
    };

    const response = await fetch(`http://127.0.0.1:${port}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`Generate fehlgeschlagen: HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const disposition = response.headers.get("content-disposition") || "";
    const bytes = Buffer.from(await response.arrayBuffer()).length;
    if (!contentType.includes("officedocument.wordprocessingml.document")) {
      throw new Error(`Unerwarteter Content-Type: ${contentType}`);
    }
    if (!disposition.toLowerCase().includes("attachment")) {
      throw new Error("Content-Disposition ohne attachment.");
    }
    if (bytes < 3000) {
      throw new Error(`DOCX zu klein (${bytes} bytes).`);
    }

    console.log(`GEN_CHECK_OK modules=${modules.length} bytes=${bytes}`);
  } finally {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  }
}

main().catch((error) => {
  console.error(`GEN_CHECK_FAIL ${error.message}`);
  process.exit(1);
});
