import { defineConfig } from 'umi';

export default defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? 'https://derek-hu.github.io/print/' : '/',
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  fastRefresh: {},
});
