const fs = require("node:fs");
const path = require("node:path");

const distPath = path.resolve(__dirname, "../dist");
const tsbuildInfoPath = path.resolve(__dirname, "../tsconfig.tsbuildinfo");

fs.rmSync(distPath, { force: true, recursive: true });
fs.rmSync(tsbuildInfoPath, { force: true });
