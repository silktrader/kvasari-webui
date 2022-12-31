<template>
  <q-card bordered class='authentication-card'>

    <q-tabs
      v-model='tab'
      indicator-color='secondary'
      align='center'
    >
      <q-tab name='signin' icon='login' label='Sign In' />
      <q-tab name='register' icon='person_add' label='Register' />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model='tab' animated>
      <q-tab-panel name='signin' class='auth-panel'>

        <q-form
          @submit='onSignIn'
          @reset='onSignInReset'
          class='q-gutter-md signin-form'
        >
          <q-input
            v-model='userAlias'
            class='credentials-input'
            label='Alias'
            lazy-rules
            standout
            :rules="[ val => val && val.length > 5 || 'Invalid alias']">
            <template v-slot:prepend>
              <q-icon name='account_circle' />
            </template>
          </q-input>

          <q-input
            v-model='userPassword'
            class='credentials-input'
            label='Password'
            :type="showPassword ? 'password' : 'text'"
            lazy-rules
            standout
            :rules="[ val => val && val.length > 8 || 'Invalid password']">
            <template v-slot:append>
              <q-icon
                v-show='userPassword'
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class='cursor-pointer'
                @click='showPassword = !showPassword'
              />
            </template>
            <template v-slot:prepend>
              <q-icon name='lock' />
            </template>
          </q-input>

          <div class='form-actions'>
            <q-btn label='Sign In' type='submit' color='accent' />
            <q-btn label='Reset' type='reset' flat :disable='!userAlias && !userPassword' />
          </div>

        </q-form>

      </q-tab-panel>

      <q-tab-panel name='register' class='auth-panel'>
        <q-form
          @submit='onRegister'
          @reset='onRegReset'
          class='signin-form'
        >
          <q-input
            v-model='regData.Alias'
            class='credentials-input'
            label='Alias'
            clearable
            standout
            bottom-slots
            lazy-rules
            :rules="[ val => !!val && val.length > 5 || 'Invalid alias']">
            <template v-slot:prepend>
              <q-icon name='account_circle' />
            </template>
          </q-input>

          <q-input
            v-model='regData.Name'
            class='credentials-input'
            label='Name'
            clearable
            standout
            bottom-slots
            lazy-rules
            :rules="[ val => val && val.length > 5 || 'Invalid name']"
          >
            <template v-slot:prepend>
              <q-icon name='badge' />
            </template>
          </q-input>

          <q-input
            v-model='regData.Email'
            class='credentials-input'
            label='Email'
            type='email'
            clearable
            standout
            bottom-slots
            lazy-rules
            :rules="[ val => !!val && val.length > 4 || 'Invalid email']"
          >
            <template v-slot:prepend>
              <q-icon name='mail' />
            </template>
          </q-input>

          <q-input
            v-model='regData.Password'
            class='credentials-input'
            label='Password'
            :type="showRegPassword ? 'password' : 'text'"
            standout
            bottom-slots
            lazy-rules
            :rules="[ val => val && val.length > 8 || 'Invalid password']">
            <template v-slot:prepend>
              <q-icon name='lock' />
            </template>
            <template v-slot:append>
              <q-icon
                v-show='regData.Password'
                :name="showRegPassword ? 'visibility_off' : 'visibility'"
                class='cursor-pointer'
                @click='showRegPassword = !showRegPassword'
              />
            </template>
          </q-input>

          <div class='form-actions'>
            <q-btn label='Register' type='submit' color='accent' />
            <q-btn label='Reset' type='reset' flat />
          </div>

        </q-form>
      </q-tab-panel>

    </q-tab-panels>


  </q-card>
</template>

<script setup lang='ts'>
import { reactive, ref } from 'vue';
import { useAuthStore } from 'stores/auth-store';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { BadRequestError } from 'boot/axios';

const tab = ref('signin');

const userAlias = ref<string | null>(null);
const userPassword = ref<string | null>(null);
const showPassword = ref<boolean>(true);

const regData = reactive({
  Alias: '',
  Password: '',
  Email: '',
  Name: ''
});
const showRegPassword = ref<boolean>(true);

const quasar = useQuasar();
const authStore = useAuthStore();
const router = useRouter();

async function onSignIn() {
  if (userAlias.value === null || userPassword.value === null) {
    return;
  }
  try {
    await authStore.SignIn(userAlias.value, userPassword.value);
    quasar.notify({
      type: 'positive',
      message: `Signed in as <b>${userAlias.value}</b>.`,
      html: true
    });
    await router.push('/stream');
  } catch (error) {
    console.log(error);
    quasar.notify({
      type: 'negative',
      message: `Couldn't sign in as <b>${userAlias.value}</b>. Please, verify both alias and password.`,
      html: true
    });
    userAlias.value = '';
    userPassword.value = '';
  }
}

function onSignInReset() {
  userAlias.value = null;
  userPassword.value = null;
}

async function onRegister() {
  try {
    await authStore.Register(regData);
    quasar.notify({
      type: 'positive',
      message: `Registered as <b>${regData.Alias}</b>.`,
      html: true
    });
    await router.push('/profile');
  } catch (error) {
    // no 2xx response
    if (error instanceof BadRequestError) {
      quasar.notify({
        type: 'negative',
        message: `User registration failed: </br><em>${error.Message}</em>`,
        html: true
      });
    } else {
      quasar.notify({
        type: 'negative',
        message: 'User registration failed.'
      });
    }
  } finally {
    onRegReset();
  }
}

function onRegReset() {
  [regData.Alias, regData.Name, regData.Password, regData.Email] = ['', '', '', ''];
}

</script>

<style scoped>

.authentication-card {
  width: 500px;
  height: max-content;
}

.credentials-input {
  width: 30ch;
}

.auth-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.signin-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 3rem;
  margin: 3rem auto 1rem;
}

</style>
