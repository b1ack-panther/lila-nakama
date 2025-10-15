import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		ignores: ["node_modules", "dist", "build", ".expo", "android", "ios"],
	},
	{
		files: ["**/*.{js,mjs,cjs,jsx}"],
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: "module",
			parserOptions: {
				ecmaFeatures: { jsx: true }, // 👈 enables JSX parsing
			},
			globals: globals.browser,
		},
		plugins: {
			react: pluginReact,
		},
		rules: {
			...js.configs.recommended.rules,
			...pluginReact.configs.flat.recommended.rules,
			"react/prop-types": "off",
		},
		settings: {
			react: {
				version: "detect", // 👈 lets ESLint detect React version automatically
			},
		},
	},
]);
