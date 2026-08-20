import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(__dirname, '../..');
loadEnvConfig(monorepoRoot);

// Single version number for the whole monorepo — bump this in the root
// package.json on release. Paired with a build timestamp (set automatically,
// no need to remember) so a stale deploy is obvious even if the version
// number wasn't bumped.
const { version } = JSON.parse(
  readFileSync(resolve(monorepoRoot, 'package.json'), 'utf-8')
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  // Without this, Next's file-tracing tries to copy/rename Prisma's native
  // engine into a synthetic `@prisma/client-<hash>` package for the
  // standalone output, and that rename target doesn't exist in dev — hence
  // "Cannot find module '@prisma/client-<hash>'". This makes Next require
  // @prisma/client normally from node_modules instead.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  turbopack: {
    root: monorepoRoot,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
