// Remove 'uglifyjs-webpack-plugin' and use Terser instead.
const TerserPlugin = require('terser-webpack-plugin'); 
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  // ... other Webpack configuration
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          sourceMap: true,
          mangle: {
            keep_fnames: true, // Keep function names to prevent conflicts
            keep_classnames: true, // Keep class names
          },
          compress: {
            pure_getters: true,
            unsafe: true,
            unsafe_comps: true,
            warnings: false,
            dead_code: false // This is a crucial setting to check
          },
        },
      }),
    ],
  },
  
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[cc].css",
    }),
  ],
};