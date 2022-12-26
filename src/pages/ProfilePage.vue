<template>
  <q-page class='profile-container'>

    <header>
      <section class='user-details'>
        <q-avatar size='120px'>
          <img src='https://artincontext.org/wp-content/uploads/2021/03/Famous-Self-Portraits-848x530.jpg'
               class='user-avatar'>
        </q-avatar>

        <section class='user-name-alias'>
          <div class='name'>
            <span>{{ authStore.user.Name }}</span>
            <q-btn round outline icon='las la-user-edit'>
              <q-popup-edit v-model='userName' :cover='false' :offset='[0, 10]' v-slot='scope' buttons
                            :validate='v => v.length > 6' @save='saveUserName'>
                <q-input color='accent' v-model='scope.value' dense autofocus counter @keyup.enter='scope.set' :rules="[
            val => scope.validate(val) || 'More than six characters required'
          ]" style='width: 35ch'>
                  <template v-slot:prepend>
                    <q-icon name='edit' color='accent' />
                  </template>
                </q-input>
              </q-popup-edit>
            </q-btn>
          </div>
          <span class='alias'>@{{ authStore.user.Alias }}</span>
        </section>
      </section>

      <section class='user-stats'>
        <span><b>{{ userStore.followers.length }}</b> Followers</span>
        <span><b>{{ userStore.followed.length }}</b> Followed</span>
        <span><b>{{ userStore.uploads.length }}</b> Artworks</span>
      </section>
    </header>

    <div>
      <ul>
        <li>
          <q-uploader
            flat
            label='Upload New Artwork'
            accept='.jpg, .jpeg, .png, .webp'

            url='http://localhost:3000/artworks'
            field-name='image'
            :form-fields='[
              {name: "alias", value: authStore.user.Alias}
            ]'
            :headers="[{name: 'Authorization', value: `Bearer: ${authStore.user.Id}`}]"
            multiple
            @rejected='onUploadRejected'
          />
        </li>
        <li v-for='artwork in userStore.uploads' :key='artwork.Id'
            @click='navigateTo(artwork.Id)'>
          <img :src='artwork.PictureURL' :alt='artwork.Description' />
          <div class='overlay'>
            <div class='metadata'>
              <div class='metadata-space'></div>
              <span class='title'>{{ artwork.Title }}</span>
              <div class='metadata-space'></div>
              <span class='added'>added {{ formatRelativeDate(artwork.Added) }}</span>
            </div>
            <div class='feedback'>
              <div>
                <q-icon size='md' name='comment'></q-icon>
                <span>{{ artwork.Comments }}</span>
              </div>
              <div>
                <q-icon size='md' name='reviews'></q-icon>
                <span>{{ artwork.Reactions }}</span>
              </div>
            </div>
          </div>
        </li>
      </ul>

    </div>

  </q-page>

</template>


<script setup lang='ts'>
import { onMounted, ref } from 'vue';
import { date, useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import { useUserStore } from 'stores/user-store';
import utilities from 'src/utilities/utilities';
import { api, BadRequestError } from 'boot/axios';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const q = useQuasar();

const userName = ref<string>();

onMounted(async () => {
  userName.value = authStore.user?.Name;
  try {
    await userStore.clearUploads();
    await userStore.updateProfile();
  } catch (error) {
    if (error instanceof BadRequestError) {
      q.notify({
        type: 'negative',
        message: `Couldn't update the user profile: </br><em>${error.Message}</em>.`,
        html: true
      });
    } else {
      q.notify({ type: 'negative', message: 'Couldn\'t update the user profile.' });
    }
  }
});

function navigateTo(artworkId: string): void {
  router.push(`/artworks/${artworkId}`);
}

function formatRelativeDate(date: Date): string {
  return utilities.FormatRelativeDate(date);
}

async function saveUserName(newName: string, oldName: string): Promise<void> {
  try {
    await authStore.updateName(newName);
    q.notify({
      type: 'positive',
      message: `Name changed from ${oldName} to <b>${newName}</b>`,
      html: true
    });
  } catch (e) {
    q.notify({
      type: 'negative',
      message: 'Couldn\'t update the user name'
    });
  }
}

async function uploadNewArtwork(files: any) {

  //await api.post(`http://localhost:3000/users/${authStore.user.Alias}/artworks`, { files });
  return new Promise((resolve, reject) => {
    resolve({
      url: `http://localhost:3000/artworks`,
      method: 'POST',
      headers: [
        { name: 'Authorization', value: `Bearer ${authStore.user?.Id}` }
      ]
    });
  });
}

function onUploadRejected(files: ReadonlyArray<{ file: { name: string, size: number } }>): void {
  q.notify({
    type: 'negative',
    message: `File <code>${files[0].file.name}</code> isn't acceptable. </br> Please, keep to PNG, or JPG, file formats.`,
    html: true
  });
}

</script>

<style scoped lang='scss'>

@import '../css/quasar.variables.scss';

$border-radius: 3px;

.profile-container {
  padding-top: $toolbar-padding + 30;
}

// header
header {
  display: flex;
  flex-direction: row;
  width: 100%;
  background-image: url("http://localhost:3000/static/background.jpg");
  align-items: flex-end;
}

.user-details {
  display: flex;
  flex-direction: row;
  gap: 16px;
  padding: 16px;
  align-items: center;
}

.user-avatar {
  object-fit: cover;
}

.user-name-alias {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: x-large;
}

.name {
  display: flex;
  flex-direction: row;
  gap: 16px;
}

.alias {
  font-size: medium;
  font-style: italic;
}

.user-stats {
  display: flex;
  gap: 32px;
  font-size: small;
  padding: 16px;
}

// uploads

ul {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  list-style: none;
  margin-block: 0;
  margin-inline: 0;
  padding-inline: 0;
  padding-left: $padding;
  padding-right: $padding;
  padding-top: $padding;
}

li {
  height: 350px;
  cursor: pointer;
  position: relative;
  flex: 1 1 auto;
}

li img {
  object-fit: cover;
  width: 100%;
  height: 100%;
  vertical-align: middle;
  border-radius: $border-radius;
}

ul::after {
  content: "";
  flex-grow: 100;
}

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 10;
  height: 100%;
  width: 100%;
  background: rgba(0, 0, 0, .5);
  color: antiquewhite;
  padding: 16px;
  pointer-events: all;
  border-radius: $border-radius;
  display: flex;
  align-items: center;
  justify-content: space-between;
  opacity: 0%;
  transition: opacity 0.5s ease-in-out;
  -moz-transition: opacity 0.5s ease-in-out;
  -webkit-transition: opacity 0.5s ease-in-out;
}

.overlay:hover {
  opacity: 100%;
  transition: opacity .5s ease-in-out;
}

.metadata {
  display: flex;
  height: 100%;
  flex-direction: column;
  font-family: 'Arapey', serif;
}

.metadata-space {
  flex-grow: 5;
}

.title {
  font-size: x-large;
}

.artist {
  color: #C8BCAC;
  font-size: large;
}

.added {
  flex-grow: 1;
  font-style: italic;
  color: #C8BCAC;
  font-size: small;
  padding-left: 5px;
}

.feedback {
  font-family: 'Montserrat', sans-serif;
  display: flex;
  gap: 10px;
  align-self: flex-end;
}

.feedback div {
  display: flex;
  flex-direction: column;
  align-items: center;
}

</style>
