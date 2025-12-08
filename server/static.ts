import express, { type Express } from "express";
import fs from "fs";
import path from "path";

// In production (CJS bundle), use process.cwd() since we run from dist/
// In development (ESM), this file isn't used (Vite serves instead)
function getDistPath(): string {
  // Production: dist/index.cjs runs from project root, public is in dist/public
  return path.resolve(process.cwd(), "dist", "public");
}

export function serveStatic(app: Express) {
  const distPath = getDistPath();
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
