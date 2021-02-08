const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const JavaScriptObfuscator = require('webpack-obfuscator');
const mode = 'development';
const autoprefixer = require('autoprefixer');
const BASE_PATH = JSON.stringify('/');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: ['react-hot-loader/patch', './src'],
  mode,
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
        },
      },
    },
  },
  node: {
    fs: 'empty',
    // buffer: 'empty',
    // http: 'empty',
    path: 'empty',
  },
  resolve: {
    extensions: [".js", ".jsx", ".tsx", ".ts"]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        },
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(mov|mp4)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(gltf|bin)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        ],
      },
      // stylesheet for global classes from external dependencies like react-md
      {
        test: path.resolve(__dirname, 'src/index.scss'),
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [autoprefixer],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              prependData: `$base-path: ${BASE_PATH};`,
              sassOptions: {
                includePaths: [
                  path.resolve('./node_modules'),
                ],
              },
            },
          },
        ],
      },
      // stylesheets for application-specific stylesheets
      {
        test: /\.(css|scss)$/,
        // exclude: path.resolve(__dirname, 'src/styles/'),
        use: [
          { loader: MiniCssExtractPlugin.loader },
          {
            loader: 'css-loader',
            options: {
              // modules: {
              //   localIdentName,
              // },
              importLoaders: 1,
              // minimize: true
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [
                autoprefixer,
                // make sure TagThat's stylesheets take precedence over react-md and .dark react-md
                // increaseSpecificity({ repeat: 1, stackableRoot: ':global(.wasmproject)' })
              ],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              prependData: `$base-path: ${BASE_PATH};`,
              sassOptions: {
                includePaths: [
                  path.resolve('./node_modules'),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: [
          'raw-loader',
          'glslify-loader',
        ],
      }
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: path.resolve(__dirname, './src/index.html'),
      filename: path.resolve(__dirname, './dist/index.html')
    }),
    new MiniCssExtractPlugin({
      filename: 'bundle.css',
    }),
    // new JavaScriptObfuscator(),
    new CopyPlugin({
      patterns: [
        { from: "./node_modules/@geenee/geetracker/dist/wasm", to: "" }
      ]
    }),
  ],
  devtool: 'eval-source-map',
  devServer: {
    contentBase: [path.join(__dirname, 'dist'), path.join(__dirname, './node_modules/@geenee/geetracker/dist/wasm')],
    compress: true,
    port: 7777
  },
};
