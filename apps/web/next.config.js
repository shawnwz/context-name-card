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
  // Lets the dev server be reached from another device on the LAN (e.g.
  // testing on a phone) without the cross-origin dev-resource block. Update
  // this if your machine's LAN IP changes.
  allowedDevOrigins: ["192.168.1.79"],
  turbopack: {
    root: monorepoRoot,
  },
  experimental: {
    // In production the app sits behind CloudFront -> ECS Express's shared
    // ALB. CloudFront deliberately doesn't forward the real Host header to
    // the origin (it has to send the ALB's own on.aws hostname instead, so
    // the ALB's host-based routing works — see infra/cdn.tf), so the ALB's
    // own x-forwarded-host ends up being that on.aws hostname rather than
    // the custom domain the browser actually used. Next's Server Actions
    // CSRF check compares Origin against x-forwarded-host and rejects the
    // mismatch by default ("Invalid Server Actions request"). This is
    // Next's own documented escape hatch for exactly that reverse-proxy
    // scenario — it doesn't weaken the check, just trusts these origins
    // even when the host header the proxy forwards doesn't match them.
    serverActions: {
      allowedOrigins: ["www.contextid.app", "contextid.app"],
    },
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
