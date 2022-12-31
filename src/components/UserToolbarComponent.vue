<template>

  <q-btn push v-if='authStore.user' color='red' label='Me'>
    <q-menu>
      <div class='user-menu'>

        <div class='user-menu-column'>
          <q-list padding class='text-primary'>
            <q-item clickable v-ripple disable>
              <q-item-section avatar>
                <q-icon name='account_circle' />
              </q-item-section>

              <q-item-section>Account</q-item-section>
            </q-item>

            <q-item clickable v-ripple disable>
              <q-item-section avatar>
                <q-icon name='send' />
              </q-item-section>
              <q-item-section>Outbox</q-item-section>
            </q-item>

            <q-item clickable v-ripple disable>
              <q-item-section avatar>
                <q-icon name='delete' />
              </q-item-section>
              <q-item-section>Trash</q-item-section>
            </q-item>

            <q-separator spaced />

            <q-item
              clickable
              v-ripple
              :active="link === 'settings'"
              @click="link = 'settings'"
            >
              <q-item-section avatar>
                <q-icon name='settings' />
              </q-item-section>

              <q-item-section>Settings</q-item-section>
            </q-item>

            <q-item clickable v-ripple disable>
              <q-item-section avatar>
                <q-icon name='help' />
              </q-item-section>

              <q-item-section>Help</q-item-section>
            </q-item>

          </q-list>
        </div>

        <q-separator vertical inset class='q-mx-lg' />

        <div class='user-menu-column'>
          <q-avatar size='120px'>
            <img src='https://artincontext.org/wp-content/uploads/2021/03/Famous-Self-Portraits-848x530.jpg'
                 class='user-avatar'>
          </q-avatar>

          <section class='user-name-alias'>
            <span>{{ authStore.user?.Name }}</span>
            <span class='artist-alias'>@{{ authStore.user?.Alias }}</span>
          </section>

          <q-btn color='primary' label='Sign Out' v-close-popup @click='signOut' />
        </div>
      </div>
    </q-menu>
  </q-btn>

</template>

<script setup lang='ts'>

import { useAuthStore } from 'stores/auth-store';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const authStore = useAuthStore();
const router = useRouter();
const quasar = useQuasar();

function signOut(): void {
  authStore.SignOut();
  quasar.notify({
    type: 'positive',
    message: 'Signed out. Until soon!',
    html: true
  });
  router.push('/authentication');
}

</script>

<style scoped>

.user-menu {
  display: flex;
  flex-wrap: nowrap;
  padding: 16px;
}

.user-menu-column {
  display: flex;
  min-width: 140px;
  align-items: center;
  flex: 1;
  flex-direction: column;
}

.user-name-alias {
  display: flex;
  flex-direction: column;
  text-align: center;
  margin-top: 1rem;
  margin-bottom: 2rem;
  gap: 10px;
  font-size: medium;
}

.artist-alias {
  font-size: small;
  font-style: italic;
}

.user-avatar {
  object-fit: cover;
}

</style>
