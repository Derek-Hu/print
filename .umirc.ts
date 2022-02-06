import { defineConfig } from 'umi';

export default defineConfig({
  publicPath: '/print/',
  base: '/print/',
  runtimePublicPath: true,
  nodeModulesTransform: {
    type: 'none',
  },
  hash: true,
  routes: [{ path: '/', component: '@/pages/index' }],
  fastRefresh: {},
});
