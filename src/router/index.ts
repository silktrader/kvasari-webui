import { route } from 'quasar/wrappers';
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router';

import routes from './routes';
import { useUserStore } from 'stores/user-store';

export default route(function(/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  });

  const us = useUserStore();

  // global guard to ensure that non-authenticated users are redirected to the authentication route
  router.beforeEach(async to => {
    if (!us.isAuthenticated && to.matched.some(record => record.meta.authenticated)) {
      // redirect the user to the authentication page
      return { name: 'authentication' };
    }
  });

  return router;
});
