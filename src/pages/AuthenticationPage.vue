<template>
  <q-page>

    <div class='container'>
      <authentication-component></authentication-component>

      <q-banner inline-actions class='warning' rounded v-show='!readNotice'>
        <ul>
          <li>Sign in with <em>any</em> password, provided it's longer than eight characters.</li>
          <li>Register new users by providing unique aliases; other fields will be randomly filled.</li>
        </ul>
        <template v-slot:action>
          <q-btn flat color='white' label='Dismiss' @click='readNotice = true' />
        </template>
      </q-banner>
    </div>

  </q-page>

</template>

<script setup>
import AuthenticationComponent from 'components/AuthenticationComponent.vue';
import { ref } from 'vue';

const readNotice = ref(false);

</script>

<style scoped>

.container {
  display: flex;
  flex-direction: column;
  gap: 100px;
  width: 100%;
  height: 100vh;
  align-items: center;
}

.container:first-child {
  padding-top: 10%;
}

.warning {
  position: fixed;
  bottom: 10%;
  background-color: #893F45;
}

</style>
