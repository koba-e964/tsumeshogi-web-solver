const CopyWebpackPlugin = require("copy-webpack-plugin");
// https://qiita.com/mizchi/items/dc089c28e4d3afa78207
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

const path = require("path");

module.exports = {
  // 入力元
  entry: {
    main: "./src/index.tsx",
    worker: "./src/worker.js",
  },
  // 出力先
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        // https://ics.media/entry/16329/
        // 拡張子 .ts もしくは .tsx の場合
        test: /\.tsx?$/,
        // TypeScript をコンパイルする
        use: "ts-loader",
      },
      {
        test: /^worker\.js$/,
        // https://zenn.dev/wok/articles/0020_bundle-webworker
        loader: "worker-loader",
        options: {
          inline: "no-fallback",
        },
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        // https://zenn.dev/wok/articles/0022_bundle-wasm
        test: /\.wasm$/,
        type: "asset/inline",
      },
    ],
  },
  resolve: {
    // 拡張子を配列で指定
    extensions: [".ts", ".tsx", ".js", ".css", ".wasm"],
  },
  // https://zenn.dev/sprout2000/articles/9d026d3d9e0e8f
  devServer: {
    static: {
      directory: __dirname,
    },
    devMiddleware: {
      writeToDisk: true,
    },
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "index.html", to: path.resolve(__dirname, "dist") },
        // { from: "src/worker.js", to: path.resolve(__dirname, "dist") },
      ],
    }),
    new WasmPackPlugin({
      crateDirectory: path.join(__dirname, ".."),
      // https://stackoverflow.com/a/60569124
      extraArgs: "--target web",
    }),
  ],
  experiments: { asyncWebAssembly: true },
};
