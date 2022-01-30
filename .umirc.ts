import { defineConfig } from 'umi';

export default defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? '/dist/' : '/',
  base: process.env.NODE_ENV === 'production' ? '/dist/' : '/',
  runtimePublicPath: true,
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [{ path: '/', component: '@/pages/index' }],
  fastRefresh: {},
});
