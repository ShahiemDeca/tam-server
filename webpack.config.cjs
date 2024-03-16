const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env, argv) => {
	const isProduction = argv.mode === "production";

	return {
		entry: "./src/index.ts",
		output: {
			filename: "bundle.js",
			path: path.resolve(__dirname, "dist"),
			publicPath: "/",
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: "ts-loader",
					exclude: /node_modules/,
				},
			],
		},
		plugins: [
			new CopyWebpackPlugin({
				patterns: [
					{
						from: path.resolve(__dirname, "public"),
						to: "assets",
						globOptions: {
							ignore: ["*.DS_Store"],
						},
					},
				],
			}),
			isProduction &&
				new MiniCssExtractPlugin({
					filename: "styles.css",
				}),
		].filter(Boolean),
		resolve: {
			alias: {
				"@src": path.resolve(__dirname, "src"),
				"@engine": path.resolve(__dirname, "src/engine"),
				"@core": path.resolve(__dirname, "src/engine/core"),
			},
			extensions: [".tsx", ".ts", ".js"],
		},
	};
};
