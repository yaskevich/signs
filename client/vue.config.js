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
	configureWebpack: {
		plugins: [
			// Define Bundler Build Feature Flags
			new webpack.DefinePlugin({
				// Drop Options API from bundle
				"__VUE_OPTIONS_API__": false,
				"__VUE_PROD_DEVTOOLS__": false,
			}),
		]},
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
