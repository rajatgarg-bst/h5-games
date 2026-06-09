const path = require("path");
const dist = path.resolve(__dirname, "dist");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const { GenerateSW } = require("workbox-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  const plugins = [
    new CleanWebpackPlugin(),
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, "crate"),
      extraArgs: "--target bundler",
    }),
    new CopyWebpackPlugin({
      patterns: [
        "js/styles.css",
        "manifest.json",
        { from: "assets/*" },
      ],
    }),
    new HtmlWebpackPlugin({ template: "index.html" }),
  ];

  // Service worker intentionally disabled for static CDN hosting: a SW caches
  // assets aggressively and registers at an absolute path, which causes
  // "stale content" surprises when re-uploading to S3/CDN and breaks under a
  // sub-path. The app works fully without it. (To re-enable PWA/offline,
  // restore GenerateSW here and the registration in js/index.js.)

  return {
    entry: "./js/bootstrap.js",
    output: {
      path: dist,
      filename: "[name].[contenthash].js",
      // "auto" makes webpack resolve chunk/wasm URLs relative to the loading
      // script at runtime, so the static build works from any CDN path (served
      // at the distribution root OR a sub-folder). Dev server keeps "/".
      publicPath: isProduction ? "auto" : "/",
    },
    devServer: {
      static: dist,
      allowedHosts: "all",
      historyApiFallback: true,
    },
    experiments: {
      asyncWebAssembly: true,
    },
    mode: isProduction ? "production" : "development",
    devtool: "source-map",
    plugins,
  module: {
    rules: [
      {
        test: /\.(glsl|frag|vert)$/,
        use: "raw-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(glsl|frag|vert)$/,
        use: "glslify-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },

      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: ["@babel/plugin-syntax-dynamic-import"],
          },
        },
      },
    ],
  },
  };
};
