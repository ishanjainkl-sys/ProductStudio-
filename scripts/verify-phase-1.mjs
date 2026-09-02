#!/usr/bin/env node
/**
 * Phase 1 — Project Setup verification
 * Checks monorepo structure, core dependencies, and Prisma layout.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];

function requirePath(relativePath, label = relativePath) {
  const full = join(root, relativePath);
  if (!existsSync(full)) {
    errors.push(`Missing ${label}: ${relativePath}`);
    return false;
  }
  return true;
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), "utf8"));
}

function hasDep(pkgJson, name) {
  return Boolean(
    pkgJson.dependencies?.[name] || pkgJson.devDependencies?.[name] || pkgJson.peerDependencies?.[name],
  );
}

console.log("ProductStudio — Phase 1 verification\n");

// Monorepo layout (Phase 1 spec)
const requiredPaths = [
  ["apps/web", "Next.js app"],
  ["apps/api", "Express API"],
  ["packages/shared-types", "shared-types package"],
  ["packages/component-sdk", "component-sdk package"],
  ["packages/component-registry", "component-registry package"],
  ["packages/json-engine", "json-engine package"],
  ["packages/renderer", "renderer package"],
  ["prisma/schema.prisma", "Prisma schema (root)"],
  ["prisma/seed.ts", "Prisma seed"],
  ["turbo.json", "Turborepo config"],
  ["docker-compose.yml", "PostgreSQL via Docker"],
  [".env.example", "Environment template"],
];

for (const [path, label] of requiredPaths) {
  requirePath(path, label);
}

// Core stack dependencies
if (requirePath("apps/web/package.json")) {
  const web = readJson("apps/web/package.json");
  for (const dep of ["next", "react", "zustand", "@dnd-kit/core", "@dnd-kit/sortable"]) {
    if (!hasDep(web, dep)) errors.push(`apps/web missing dependency: ${dep}`);
  }
}

if (requirePath("apps/api/package.json")) {
  const api = readJson("apps/api/package.json");
  for (const dep of ["express", "@prisma/client", "zod"]) {
    if (!hasDep(api, dep)) errors.push(`apps/api missing dependency: ${dep}`);
  }
  const schemaFlag = api.scripts?.generate?.includes("../../prisma/schema.prisma");
  if (!schemaFlag) {
    errors.push("apps/api prisma scripts must point to ../../prisma/schema.prisma");
  }
}

if (requirePath("package.json")) {
  const rootPkg = readJson("package.json");
  if (!rootPkg.workspaces?.includes("apps/*")) {
    errors.push("Root package.json must include apps/* workspace");
  }
  if (!rootPkg.scripts?.["verify:phase1"]) {
    errors.push("Root package.json missing verify:phase1 script");
  }
  if (!rootPkg.scripts?.["db:generate"]?.includes("./prisma/schema.prisma")) {
    errors.push("Root db:generate must use ./prisma/schema.prisma");
  }
}

// Phase 1 packages build scripts
for (const pkg of [
  "shared-types",
  "component-sdk",
  "component-registry",
  "json-engine",
  "renderer",
]) {
  const pkgPath = `packages/${pkg}/package.json`;
  if (requirePath(pkgPath)) {
    const json = readJson(pkgPath);
    if (!json.scripts?.build) errors.push(`packages/${pkg} missing build script`);
    if (!json.scripts?.typecheck) errors.push(`packages/${pkg} missing typecheck script`);
  }
}

// Extra packages beyond Phase 1 (informational only)
for (const extra of ["shared-schemas", "auth", "export-engine", "ui-kit"]) {
  if (existsSync(join(root, "packages", extra))) {
    warnings.push(`Optional (post–Phase 1) package present: packages/${extra}`);
  }
}

console.log("Structure & dependencies");
if (errors.length === 0) {
  console.log("  ✓ All Phase 1 checks passed\n");
} else {
  console.log(`  ✗ ${errors.length} issue(s)\n`);
  for (const err of errors) console.log(`  - ${err}`);
}

if (warnings.length) {
  console.log("\nNotes");
  for (const warn of warnings) console.log(`  • ${warn}`);
}

process.exit(errors.length ? 1 : 0);
