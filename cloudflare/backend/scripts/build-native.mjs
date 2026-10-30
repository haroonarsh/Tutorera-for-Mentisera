import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { builtinModules } from "node:module";

const builtins = new Set(builtinModules.map((name) => name.replace(/^node:/, "")));

// Some legacy dependencies declare browser-only exports that break when Node
// compatibility exposes process. Bundle for Node, not the browser, without
// changing node_modules or weakening request-body decoding/signature checks.
await build({
  entryPoints: [fileURLToPath(new URL("../src/index.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("../dist/worker.mjs", import.meta.url)),
  bundle: true, format: "esm", platform: "node", target: "es2022",
  conditions: ["workerd", "node"],
  external: ["cloudflare:*"],
  plugins: [{
    name: "static-node-builtins",
    setup(plugin) {
      plugin.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === "require-call" && builtins.has(args.path.replace(/^node:/, ""))) {
          return { path: args.path.replace(/^node:/, ""), namespace: "native-require" };
        }
      });
      plugin.onLoad({ filter: /.*/, namespace: "native-require" }, (args) => ({
        contents: `import * as native from ${JSON.stringify("node:" + args.path)}; module.exports = native.default ?? native;`,
        loader: "js",
      }));
    },
  }],
  alias: {
    pdfkit: fileURLToPath(new URL("../../../tutorera-backend/node_modules/pdfkit/js/pdfkit.standalone.js", import.meta.url)),
    // Maintainer-provided warning-only implementation avoids depd's new Function.
    depd: fileURLToPath(new URL("../../../tutorera-backend/node_modules/depd/lib/browser/index.js", import.meta.url)),
  },
  define: { "process.env.NODE_ENV": '"production"' },
  banner: { js: 'import { createRequire as createNativeRequire } from "node:module"; const require = createNativeRequire("/bundle/worker.mjs"); const __dirname = "/bundle"; const __filename = "/bundle/worker.mjs";' },
  logLevel: "info",
});
