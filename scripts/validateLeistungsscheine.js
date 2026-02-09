const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");

const ROOT_DIR = path.join(__dirname, "..", "data", "leistungsscheine");
const SCHEMA_FILE = path.join(__dirname, "..", "data", "schema", "leistungsschein.schema.json");

function walkJsonFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkJsonFiles(fullPath, files);
      return;
    }
    if (entry.isFile() && fullPath.toLowerCase().endsWith(".json")) {
      files.push(fullPath);
    }
  });
  return files;
}

function rel(filePath) {
  return path.relative(path.join(__dirname, ".."), filePath).replace(/\\/g, "/");
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => {
    const dataPath = error.instancePath || "/";
    return `${dataPath} ${error.message}`.trim();
  });
}

function main() {
  if (!fs.existsSync(SCHEMA_FILE)) {
    throw new Error(`Schema nicht gefunden: ${SCHEMA_FILE}`);
  }
  const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  const files = walkJsonFiles(ROOT_DIR, []);
  if (files.length === 0) {
    throw new Error(`Keine Leistungsscheine unter ${ROOT_DIR} gefunden.`);
  }

  const idToFile = new Map();
  const errors = [];
  let validCount = 0;

  files.forEach((filePath) => {
    let json;
    try {
      json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      errors.push(`${rel(filePath)}: JSON parse error: ${error.message}`);
      return;
    }

    const ok = validate(json);
    if (!ok) {
      const details = formatAjvErrors(validate.errors).join("; ");
      errors.push(`${rel(filePath)}: Schema invalid: ${details}`);
    } else {
      validCount += 1;
    }

    const id = String(json.id || "");
    const filename = path.basename(filePath);
    if (id) {
      const key = id.toLowerCase();
      if (idToFile.has(key)) {
        errors.push(
          `Duplicate ID ${id}: ${rel(idToFile.get(key))} <-> ${rel(filePath)}`
        );
      } else {
        idToFile.set(key, filePath);
      }
      if (!filename.toLowerCase().includes(key)) {
        errors.push(`${rel(filePath)}: Dateiname enthaelt ID ${id} nicht.`);
      }
    } else {
      errors.push(`${rel(filePath)}: Fehlende ID.`);
    }
  });

  console.log(`[validate] Dateien: ${files.length}, schema-valid: ${validCount}`);
  if (errors.length > 0) {
    console.error(`[validate] Fehler: ${errors.length}`);
    errors.slice(0, 120).forEach((line) => console.error(` - ${line}`));
    if (errors.length > 120) {
      console.error(` - ... ${errors.length - 120} weitere Fehler`);
    }
    process.exit(1);
  }
  console.log("[validate] OK");
}

try {
  main();
} catch (error) {
  console.error(`[validate] Fehler: ${error.message}`);
  process.exit(1);
}
