import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party bundle (sql.js) and Node utility scripts —
    // not part of the app source, should not be linted.
    "public/**",
    "scripts/**",
  ]),
  {
    // These setState-in-effect usages are intentional and follow documented
    // React patterns: the next-themes "mounted" guard, resetting playback when
    // the timeline length changes, and a requestAnimationFrame count-up.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
