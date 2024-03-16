import typescript from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import url from "rollup-plugin-url";

export default {
	input: "src/index.ts",
	output: {
		file: "dist/bundle.js",
		format: "es",
		sourcemap: false,
		plugins: [
			terser({
				ecma: 2021,
				module: true,
				warnings: true,
				mangle: {
					properties: {
						regex: /^__/,
					},
				},
				compress: {
					drop_console: true,
					dead_code: true,
				},
				output: {
					comments: false,
				},
			}),
		],
	},
	plugins: [
		resolve(),
		typescript({
			tsconfig: "tsconfig.json",
		}),
		url(),
	],
};
