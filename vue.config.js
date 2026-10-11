// vue.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/ttprod/v3/hrcomms/' : '/',
  pages: {
    index: {
      entry: 'src/main.js',
      title: 'Screens'
    }
  },
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/ttprod/v3/hrcomms/api'
        }
      }
    }
  }
})