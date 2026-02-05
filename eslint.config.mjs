import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Здесь мы указываем папки, которые линтер должен пропускать
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "components/ui/**", // Игнорируем автоматически созданные компоненты shadcn
  ]),
]);

export default eslintConfig;
