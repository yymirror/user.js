import alias from "@rollup/plugin-alias";
import typescript from "@rollup/plugin-typescript";
import { resolve } from "path";

import externalResource, {
  getResourceMapping,
} from "./scripts/external-resource";

const root = "src/app";

export default {
  input: `${root}/index.ts`,
  output: {
    banner: () => {
      // eslint-disable-next-line global-require
      const meta = require("./package.json");
      const scriptMeta = meta["user-script-meta"] || {};

      scriptMeta.version = meta.version;
      if (!scriptMeta.name && meta.name) scriptMeta.name = meta.name;
      if (!scriptMeta.namespace && meta.homepage)
        scriptMeta.namespace = meta.homepage;
      if (!scriptMeta.description && meta.description)
        scriptMeta.description = meta.description;
      if (!scriptMeta.author && (meta.author?.name || meta.author))
        scriptMeta.author = meta.author?.name || meta.author;
      if (!scriptMeta.homepage && meta.homepage)
        scriptMeta.homepage = meta.homepage;
      if (!scriptMeta.supportURL && (meta.bugs?.url || meta.homepage))
        scriptMeta.supportURL = meta.bugs.url || meta.homepage;

      scriptMeta.resource = getResourceMapping({
        baseUrl: scriptMeta.homepage,
      });

      const metaString = Object.entries(scriptMeta)
        .map(([metaKey, metaValue]) => {
          function getMetaString(key, value) {
            return `// @${key.padEnd(15)} ${value}`;
          }

          if (Array.isArray(metaValue)) {
            return metaValue.map(v => getMetaString(metaKey, v)).join("\n");
          }

          if (typeof metaValue === "object") {
            return Object.entries(metaValue)
              .map(([k, v]) => getMetaString(`${metaKey}:${k}`, v))
              .join("\n");
          }

          return getMetaString(metaKey, metaValue);
        })
        .join("\n");

      return `// ==UserScript==\n${metaString}\n// ==/UserScript==\n`;
    },
    file: "dist/bundle.user.js",
    format: "umd",
    minifyInternalExports: false,
  },
  plugins: [
    alias({
      entries: [
        { find: "@views", replacement: resolve(__dirname, "dist/views") },
        { find: "@common", replacement: resolve(__dirname, "src/common") },
      ],
    }),
    typescript({
      tsconfig: `${root}/tsconfig.json`,
    }),
    externalResource({
      production: process.env.NODE_ENV === "production",
    }),
  ],
};
