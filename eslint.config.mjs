import js from '@eslint/js'
import {defineConfig} from 'eslint/config'
import tseslint from 'typescript-eslint'
import github from 'eslint-plugin-github'

export default defineConfig(
  {
    ignores: [
      '**/dist/',
      '**/lib/',
      '**/node_modules/',
      '**/eslint.config.mjs'
    ],
    files: ['src/**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      github.getFlatConfigs().recommended,
      github.getFlatConfigs().typescript
    ],
    rules: {
      "i18n-text/no-en": "off",
      "import/no-namespace": "off",
    }
  }
)
