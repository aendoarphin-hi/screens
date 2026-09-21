// vue.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: '/ttprod/v3/hrcomms/app/',
  devServer: {
    port: 8080,
    proxy: {
      '/hrcomms': {
        target: 'http://localhost',
        changeOrigin: true,
        pathRewrite: {
          '^/hrcomms': '/ttprod/v3/hrcomms/'
        }
      }
    }
  }
})