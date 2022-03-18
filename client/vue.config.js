//vue.config.js
const webpack = require('webpack');
module.exports = {
  pages: {
    index: {
      entry: 'src/main.ts',
      // the source template
      template: 'public/index.html',
      // output as dist/index.html
      filename: 'index.html',
      title: 'Signs'
    }
  },
  devServer: {
    port: 3040,
    host: "localhost",
    https: false,
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:3041",
        changeOrigin: true,
        ws:true,
        // pathRewrite: {
          // "^/api": ""
        // },
        logLevel: 'debug'
      },
    }
  }
}
