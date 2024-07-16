const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  // ... other Webpack configuration
  plugins: [
    new UglifyJSPlugin({
      uglifyOptions: {
        mangle: {
          keep_fnames: false,
          keep_classnames: false,
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