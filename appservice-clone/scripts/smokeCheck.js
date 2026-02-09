const { spawn } = require("child_process");
const { spawnSync } = require("child_process");

const port = Number(process.env.SMOKE_PORT || 3100);
const host = `http://127.0.0.1:${port}`;
function cleanEnv(rawEnv) {
  const safe = {};
  Object.keys(rawEnv || {}).forEach((key) => {
    if (key.startsWith("=")) {
      return;
    }
    const value = rawEnv[key];
    if (typeof value === "string") {
      safe[key] = value;
    }
  });
  return safe;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs = 20000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${host}/healthz`);
      if (response.ok) {
        return true;
      }
    } catch (_error) {
      // keep polling
    }
    await sleep(500);
  }
  return false;
}

async function main() {
  const env = {
    ...cleanEnv(process.env),
    PORT: String(port),
  };
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", "npm start"], { env, stdio: ["ignore", "pipe", "pipe"] })
      : spawn("npm", ["start"], { env, stdio: ["ignore", "pipe", "pipe"] });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });

  try {
    const up = await waitForServer();
    if (!up) {
      throw new Error("Server konnte nicht gestartet werden.");
    }

    const healthRes = await fetch(`${host}/healthz`);
    const modulesRes = await fetch(`${host}/api/modules`);
    const health = await healthRes.json();
    const modules = await modulesRes.json();

    if (!Array.isArray(modules)) {
      throw new Error("API /api/modules liefert kein Array.");
    }

    console.log(`SMOKE health=${health.status} modules=${modules.length} port=${port}`);
  } finally {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
      await sleep(300);
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
  }

  if (stderr.includes("EADDRINUSE")) {
    throw new Error("Port-Konflikt waehrend Smoke-Test.");
  }
}

main().catch((error) => {
  console.error(`SMOKE_FAIL ${error.message}`);
  process.exit(1);
});
