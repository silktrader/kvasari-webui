<template>
  <q-card bordered class='authentication-card'>

    <q-tabs
      v-model='tab'
      align='center'
      indicator-color='secondary'
    >
      <q-tab icon='login' label='Sign In' name='signin' />
      <q-tab icon='person_add' label='Register' name='register' />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model='tab' animated>
      <q-tab-panel class='auth-panel' name='signin'>

        <q-form
          class='q-gutter-md signin-form'
          @reset='onSignInReset'
          @submit='onSignIn'
        >
          <q-input
            v-model='userAlias'
            :rules="[ val => val && val.length > 5 || 'Invalid alias']"
            class='credentials-input'
            label='Alias'
            lazy-rules
            standout>
            <template v-slot:prepend>
              <q-icon name='account_circle' />
            </template>
          </q-input>

          <q-input
            v-model='userPassword'
            :rules="[ val => val && val.length > 8 || 'Invalid password']"
            :type="showPassword ? 'password' : 'text'"
            class='credentials-input'
            label='Password'
            lazy-rules
            standout>
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
            <q-btn color='accent' label='Sign In' type='submit' />
            <q-btn :disable='!userAlias && !userPassword' flat label='Reset' type='reset' />
          </div>

        </q-form>

      </q-tab-panel>

      <q-tab-panel class='auth-panel' name='register'>
        <q-form
          class='signin-form'
          @reset='onRegReset'
          @submit='onRegister'
        >
          <q-input
            v-model='regData.Alias'
            :rules="[ val => !!val && val.length > 5 || 'Invalid alias']"
            bottom-slots
            class='credentials-input'
            clearable
            label='Alias'
            lazy-rules
            standout>
            <template v-slot:prepend>
              <q-icon name='account_circle' />
            </template>
          </q-input>

          <q-input
            v-model='regData.Name'
            :rules="[ val => val && val.length > 5 || 'Invalid name']"
            bottom-slots
            class='credentials-input'
            clearable
            label='Name'
            lazy-rules
            standout
          >
            <template v-slot:prepend>
              <q-icon name='badge' />
            </template>
          </q-input>

          <q-input
            v-model='regData.Email'
            :rules="[ val => !!val && val.length > 4 || 'Invalid email']"
            bottom-slots
            class='credentials-input'
            clearable
            label='Email'
            lazy-rules
            standout
            type='email'
          >
            <template v-slot:prepend>
              <q-icon name='mail' />
            </template>
          </q-input>

          <q-input
            v-model='regData.Password'
            :rules="[ val => val && val.length > 8 || 'Invalid password']"
            :type="showRegPassword ? 'password' : 'text'"
            bottom-slots
            class='credentials-input'
            label='Password'
            lazy-rules
            standout>
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
            <q-btn color='accent' label='Register' type='submit' />
            <q-btn flat label='Reset' type='reset' />
          </div>

        </q-form>
      </q-tab-panel>

    </q-tab-panels>


  </q-card>
</template>

<script lang='ts' setup>
import { reactive, ref } from 'vue';
import { useUserStore } from 'stores/user-store';
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
const authStore = useUserStore();
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
    await router.push('/me');
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
