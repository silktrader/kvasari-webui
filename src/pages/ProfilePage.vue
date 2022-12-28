<template>
  <q-page class='profile-container'>

    <header>
      <section class='user-details'>
        <q-avatar size='120px'>
          <img src='https://artincontext.org/wp-content/uploads/2021/03/Famous-Self-Portraits-848x530.jpg'
               class='user-avatar' alt='User Profile Cover'>
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
        <span><b>{{ userStore.Uploads.length }}</b> Artworks</span>
      </section>
    </header>

    <div>
      <div class='uploads-previews'>
        <div>
          <q-uploader
            flat
            label='Upload New Artwork'
            :accept='acceptableFormats.join(", ")'
            :max-file-size='maxFileSize'
            url='http://localhost:3000/artworks'
            field-name='image'
            :form-fields='[
              {name: "alias", value: authStore.user.Alias}
            ]'
            :headers="[{name: 'Authorization', value: `Bearer ${authStore.user.Id}`}]"
            multiple
            @rejected='onUploadRejected'
            @failed='onFailedUpload'
          />
        </div>
        <artwork-preview-component v-for='artwork in userStore.Uploads' :key='artwork.Id'
                                   :artwork='artwork'></artwork-preview-component>
        <div class='spacer'></div>

      </div>

    </div>

  </q-page>

</template>


<script setup lang='ts'>
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth-store';
import { useUserStore } from 'stores/user-store';
import { BadRequestError } from 'boot/axios';
import ArtworkPreviewComponent from 'components/ArtworkPreviewComponent.vue';

const userStore = useUserStore();
const authStore = useAuthStore();
const q = useQuasar();

const maxFileSize = 41943040; // ~40MB
const acceptableFormats: ReadonlyArray<string> = ['.jpg', '.jpeg', '.png', '.webp'];

const userName = ref<string>();

onMounted(async () => {
  userName.value = authStore.user?.Name;
  try {
    await userStore.clearUploads();
    await userStore.UpdateProfile();
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

function onUploadRejected(files: ReadonlyArray<{ file: { name: string, size: number } }>): void {
  files.forEach(f => {
    if (f.file.size >= maxFileSize) {
      q.notify({
        type: 'negative',
        message: `<code>${truncateFileName(f.file.name)}</code> is larger than ${(maxFileSize / 1048576).toFixed(2)}MiB`,
        html: true
      });
    }

    // not exclusive condition; there probably is a more concise way to perform the check
    let invalidFormat = true;
    for (const format of acceptableFormats) {
      if (f.file.name.endsWith(format)) {
        invalidFormat = false;
        break;
      }
    }

    if (invalidFormat) {
      q.notify({
        type: 'negative',
        message: `<code>${truncateFileName(f.file.name)}</code> must be either a: <code>${acceptableFormats.join(', ')}</code>`,
        html: true
      });
    }

  });
}

function truncateFileName(fileName: string): string {
  return fileName.length > 16 ? `${fileName.slice(0, 16)}...` : fileName;
}

// can't rely on the usual Axios interceptor; interpret the action's response as either a message (BR) or an error (ISE)
function onFailedUpload(info: { xhr: { response: string } }): void {
  const responseText = JSON.parse(info.xhr.response);
  q.notify({
    type: 'negative',
    message: `A problem arose while uploading the image. <br/>${responseText?.Message ?? responseText?.Error}`,
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

.uploads-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding-left: $padding;
  padding-right: $padding;
  padding-top: $padding;
}

.spacer {
  flex-grow: 10;
}

//li {
//  height: 350px;
//  cursor: pointer;
//  position: relative;
//  flex: 1 1 auto;
//}
//
//li img {
//  object-fit: cover;
//  width: 100%;
//  height: 100%;
//  vertical-align: middle;
//  border-radius: $border-radius;
//}
//
//ul::after {
//  content: "";
//  flex-grow: 100;
//}
//
//.overlay {
//  position: absolute;
//  bottom: 0;
//  left: 0;
//  z-index: 10;
//  height: 100%;
//  width: 100%;
//  background: rgba(0, 0, 0, .5);
//  color: antiquewhite;
//  padding: 16px;
//  pointer-events: all;
//  border-radius: $border-radius;
//  display: flex;
//  align-items: center;
//  justify-content: space-between;
//  opacity: 0%;
//  transition: opacity 0.5s ease-in-out;
//  -moz-transition: opacity 0.5s ease-in-out;
//  -webkit-transition: opacity 0.5s ease-in-out;
//}
//
//.overlay:hover {
//  opacity: 100%;
//  transition: opacity .5s ease-in-out;
//}
//
//.metadata {
//  display: flex;
//  height: 100%;
//  flex-direction: column;
//  font-family: 'Arapey', serif;
//}
//
//.metadata-space {
//  flex-grow: 5;
//}
//
//.title {
//  font-size: x-large;
//}
//
//.artist {
//  color: #C8BCAC;
//  font-size: large;
//}
//
//.added {
//  flex-grow: 1;
//  font-style: italic;
//  color: #C8BCAC;
//  font-size: small;
//  padding-left: 5px;
//}
//
//.feedback {
//  font-family: 'Montserrat', sans-serif;
//  display: flex;
//  gap: 10px;
//  align-self: flex-end;
//}
//
//.feedback div {
//  display: flex;
//  flex-direction: column;
//  align-items: center;
//}

</style>
