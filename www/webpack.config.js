const path = require("path");

module.exports = {
  // 入力元
  entry: "./src/index.tsx",
  // 出力先
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
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
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  resolve: {
    // 拡張子を配列で指定
    extensions: [".ts", ".tsx", ".js"],
  },
  // https://zenn.dev/sprout2000/articles/9d026d3d9e0e8f
  devServer: {
    static: {
      directory: "./",
    },
  },
};
