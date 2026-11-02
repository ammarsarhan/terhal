import base from "@terhal/eslint-config";
import { defineConfig } from "eslint/config";

export default defineConfig(base, {
  languageOptions: {
    parserOptions: { tsconfigRootDir: import.meta.dirname },
  },
});
