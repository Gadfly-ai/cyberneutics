import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.join(__dirname, "..");
const examplePath = path.join(demoRoot, ".env.example");
const localPath = path.join(demoRoot, ".env.local");

if (fs.existsSync(localPath)) {
  console.log(".env.local already exists — leaving it unchanged.");
  process.exit(0);
}

if (!fs.existsSync(examplePath)) {
  console.error("Missing .env.example (expected next to this script).");
  process.exit(1);
}

fs.copyFileSync(examplePath, localPath);
console.log("Created .env.local from .env.example.");
console.log("Edit .env.local to add ANTHROPIC_API_KEY if you want live API mode; otherwise the demo runs locally.");
