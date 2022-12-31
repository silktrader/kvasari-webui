import { RouteRecordRaw } from 'vue-router';
import ProfilePage from 'pages/ProfilePage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: { name: 'profile' } },
      {
        path: '/authentication',
        name: 'authentication',
        component: () => import('pages/AuthenticationPage.vue'),
      },
      {
        path: ':alias',
        component: ProfilePage,
        meta: {
          authenticated: true,
        },
      },
      {
        path: '/me',
        name: 'profile',
        component: ProfilePage,
        meta: {
          authenticated: true,
        },
      },
      {
        path: '/stream',
        component: () => import('pages/StreamPage.vue'),
        meta: {
          authenticated: true,
        },
      },
      {
        path: '/artworks/:artworkId',
        component: () => import('pages/ArtworkPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
