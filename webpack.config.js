const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  devtool: false, // Explicitly disable source maps
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          mangle: {
            keep_fnames: false, // Mangle function names
            keep_classnames: false, // Mangle class names
            toplevel: true // Mangle top-level variables

            // properties: {
            //   regex: /^m_/,
            //   reserved: ['m_index'], // Exclude specific properties if needed
            // },

          },
          compress: {
            pure_getters: true,
            drop_console: true, // Remove all console.* calls
            drop_debugger: true, // Remove debugger statements
            dead_code: true, // Remove dead code
            passes: 3, // Increase passes for thorough optimization
          },
          format: {
            comments: false, // Remove comments
          },
        },
        extractComments: false, // Do not extract comments to a separate file
      }),
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
};