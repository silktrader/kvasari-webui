<template>
  <q-layout view='hHh lpR fFf'>

    <header v-if='user'>

      <search-component></search-component>

      <router-link to='/stream' class='link'>Stream</router-link>
      <router-link to='/me' class='link'>Profile</router-link>

      <div class='spacer'></div>

      <user-toolbar-component></user-toolbar-component>
    </header>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup lang='ts'>

import UserToolbarComponent from 'components/UserToolbarComponent.vue';
import { useUserStore } from 'stores/user-store';
import SearchComponent from 'components/SearchComponent.vue';
import { storeToRefs } from 'pinia';

const { user } = storeToRefs(useUserStore());

</script>


<style scoped lang='scss'>

@import '../css/quasar.variables.scss';

header {
  position: absolute;
  display: flex;
  width: 100%;
  padding-top: 10px;
  height: 60px;
  font-family: 'Lato', sans-serif;
  // tk change above or set
  z-index: 1; // watch out or it might cover UI elements scrolled into view
  gap: 2rem;
  padding-left: $padding;
  padding-right: $padding;

  .link {
    font-size: large;
  }

  //pointer-events: none;
}

.header-interactive {
  opacity: 0.5;
  background-image: -webkit-linear-gradient(#202327, rgba(32, 35, 39, 0.738) 19%, rgba(32, 35, 39, 0.541) 34%, rgba(32, 35, 39, 0.382) 47%, rgba(32, 35, 39, 0.278) 56.5%, rgba(32, 35, 39, 0.194) 65%, rgba(32, 35, 39, 0.126) 73%, rgba(32, 35, 39, 0.075) 80.2%, rgba(32, 35, 39, 0.042) 86.1%, rgba(32, 35, 39, 0.021) 91%, rgba(32, 35, 39, 0.008) 95.2%, rgba(32, 35, 39, 0.002) 98.2%, rgba(32, 35, 39, 0));
  background-image: linear-gradient(#202327, rgba(32, 35, 39, 0.738) 19%, rgba(32, 35, 39, 0.541) 34%, rgba(32, 35, 39, 0.382) 47%, rgba(32, 35, 39, 0.278) 56.5%, rgba(32, 35, 39, 0.194) 65%, rgba(32, 35, 39, 0.126) 73%, rgba(32, 35, 39, 0.075) 80.2%, rgba(32, 35, 39, 0.042) 86.1%, rgba(32, 35, 39, 0.021) 91%, rgba(32, 35, 39, 0.008) 95.2%, rgba(32, 35, 39, 0.002) 98.2%, rgba(32, 35, 39, 0));
}

a {
  padding: 10px 15px 10px 15px;
  background-color: rgba(0, 0, 0, 0.25);
  background-image: none;
  border-radius: 3px;
  text-decoration: none;
  color: whitesmoke;
  transition: color 0.5s, background-color 0.5s, opacity 0.5s;
  line-height: 1.4;
}

a:hover {
  background-color: whitesmoke;
  color: black;
}

.q-page {
  height: 100%;
  background-color: $stone-background;
}

//.q-page-container {
//  padding-top: 0 !important;
//}

.spacer {
  flex-grow: 10;
}

</style>
