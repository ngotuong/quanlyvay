import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const dist = path.join(appRoot, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of ["Config.js", "Core.js", "Code.js"]) await cp(path.join(appRoot, "src", file), path.join(dist, file));
await cp(path.join(appRoot, "appsscript.json"), path.join(dist, "appsscript.json"));
