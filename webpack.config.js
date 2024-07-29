const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  // ... other Webpack configuration
  optimization: {
    minimize: true,
    minimizer: [
      new UglifyJsPlugin({
        parallel: true,
        sourceMap: true,
        mangle: true,
      }),
    ],
  },
  
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[cc].css",
    }),
    new UglifyJSPlugin({
      uglifyOptions: {
        mangle: {
          keep_fnames: false,
          keep_classnames: false,
          keep_fnames: false
        },
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      },
    }),
  ],
};