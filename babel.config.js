module.exports = {
  babelrcRoots: [__dirname, __dirname + "/common"],
  presets: [
    [
      "@babel/preset-env", {
        "targets": {
          "node": "current"
        }
      }
    ],
    "@babel/preset-react"
  ],
  plugins: [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-transform-arrow-functions",
    "@babel/plugin-transform-runtime",
    "react-hot-loader/babel",
    [
      "react-css-modules",
      {
        // "generateScopedName": "[hash:base64]",
        "filetypes": {
          ".scss": {
            "syntax": "postcss-scss"
          }
        }
      }
    ]
  ]
};
