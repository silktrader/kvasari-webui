<template>
  <q-page class='profile-container'>

    <div class='profile-header'>
      <div class='header-cover'></div>
      <div class='header-cover-gradient'></div>
      <section class='user-details'>
        <q-avatar size='120px'>
          <img src='https://artincontext.org/wp-content/uploads/2021/03/Famous-Self-Portraits-848x530.jpg'
               class='user-avatar' alt='User Profile Cover'>
        </q-avatar>

        <section class='user-name-alias'>
          <div class='name'>
            <span>{{ artist.Name }}</span>

            <!-- Name editing shortcut for the profile owner -->
            <q-btn round outline icon='las la-user-edit' v-if='isUser'>
              <q-popup-edit v-model='artist.Name'
                            :cover='false'
                            :offset='[0, 10]'
                            v-slot='scope'
                            :validate='v => v && v.length > 6'
                            @save='saveUserName'>
                <q-input color='accent'
                         v-model='scope.value'
                         dense
                         autofocus
                         counter
                         spellcheck='false'
                         @keyup.enter='scope.set'
                         :rules="[val => scope.validate(val) || 'More than six characters required']"
                         style='width: 35ch'>
                  <template v-slot:prepend>
                    <q-icon name='edit' color='accent' />
                  </template>
                  <template v-slot:after>
                    <q-btn
                      flat dense icon='cancel'
                      @click.stop.prevent='scope.cancel'
                    />

                    <q-btn
                      flat dense icon='check_circle'
                      @click.stop.prevent='scope.set'
                      :disable='scope.validate(scope.value) === false || scope.initialValue === scope.value'
                    />
                  </template>
                </q-input>
              </q-popup-edit>
            </q-btn>

            <!-- Relevant controls when viewing another user's profile -->
            <q-btn rounded outline label='Follow' v-if='canFollow' @click='follow()'></q-btn>
            <q-btn rounded outline label='Unfollow' v-if='canUnfollow'></q-btn>

          </div>
          <span class='alias'>@{{ artist.Alias }}</span>
        </section>
      </section>

      <section class='user-stats'>
        <q-btn flat no-caps><span class='user-stat-label'><b>{{ artist.Followers }}</b> Followers</span></q-btn>
        <q-btn flat no-caps><span class='user-stat-label'><b>{{ artist.Following }}</b> Following</span></q-btn>
        <q-btn flat no-caps><span class='user-stat-label'><b>{{ artist.Artworks }}</b> Artworks</span></q-btn>
        <span style='flex-grow: 3'></span>
        <q-btn flat no-caps dense>
          <span class='user-stat-label'>
            <b>{{ artist.Comments }}</b>
            <q-icon name='comment' />
          </span>
        </q-btn>

        <q-btn flat no-caps dense>
          <span class='user-stat-label'>
            <b>{{ artist.Reactions }}</b>
            <q-icon name='recommend' />
          </span>
        </q-btn>
        <span style='flex-grow: 1'></span>

      </section>
    </div>

    <div>
      <div class='uploads-previews'>
        <div v-if='isUser'>
          <q-uploader
            flat
            label='Upload New Artwork'
            :accept='acceptableFormats.join(", ")'
            :max-file-size='maxFileSize'
            url='http://localhost:3000/artworks'
            field-name='image'
            :form-fields='[
              {name: "alias", value: us.user.Alias}
            ]'
            :headers="[{name: 'Authorization', value: `Bearer ${us.user.Id}`}]"
            multiple
            @rejected='onUploadRejected'
            @failed='onFailedUpload'
          />
        </div>
        <artwork-preview-component v-for='[id, artwork] in artworks' :key='id'
                                   :artwork='artwork' :author='artist'></artwork-preview-component>
        <div class='spacer'></div>

      </div>

    </div>

  </q-page>

</template>


<script setup lang='ts'>
import { computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useUserStore } from 'stores/user-store';
import { useArtistStore } from 'stores/artist-store';
import { BadRequestError } from 'boot/axios';
import ArtworkPreviewComponent from 'components/ArtworkPreviewComponent.vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

const route = useRoute();
const as = useArtistStore();
const us = useUserStore();
const q = useQuasar();

const maxFileSize = 41943040; // ~40MB
const acceptableFormats: ReadonlyArray<string> = ['.jpg', '.jpeg', '.png', '.webp'];

const { artist, artworks } = storeToRefs(as);

// Watch the route parameters for changes on creation. Two possibilities arise:
// 1. `undefined` when the "/me" path is accessed
// 2. `alias` otherwise
watch(
  () => route.params,
  toParams => {
    try {
      const alias = toParams.alias as string ?? us.user?.Alias;
      as.setArtist(alias);
      as.resetArtworks();
      as.loadArtworks(alias);
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
  },
  { immediate: true }
);

// determines whether the viewing user matches the authenticated one; can be referred to by other computed props.
const isUser = computed(() => as.artist.Alias === us.user?.Alias);

// determines whether the viewing user can follow the target; banned users won't view the profile at all
const canFollow = computed<boolean>(() => !isUser.value && !artist.value.FollowedByUser);

// determines whether the viewing user can unfollow the target
const canUnfollow = computed<boolean>(() => !isUser.value && artist.value.FollowedByUser);

// Attempts to perform a name change, updating stores on success.
async function saveUserName(newName: string, oldName: string): Promise<void> {
  try {
    // only auth users are allowed to edit their name when viewing their profile
    await us.updateName(newName);
    // there's a potential issue with using a readonly field as input model
    as.updateName(newName);
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

function follow(): void {
  try {
    us.followArtist(artist.value.Alias);
    as.addUserAsFollower();
    q.notify({
      type: 'positive',
      message: `You now follow <b>${artist.value.Alias}</b>.`,
      html: true
    });
  } catch (e) {
    console.error(e);
    q.notify({
      type: 'negative',
      message: `A problem arose while attemptint to follow <b>${artist.value.Alias}</b>`,
      html: true
    });
  }
}


</script>

<style scoped lang='scss'>

@import '../css/quasar.variables.scss';

$border-radius: 3px;

.profile-container {
  padding-top: $toolbar-padding + 30;
}

// header
.profile-header {
  position: relative;
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: flex-end;
}

.header-cover {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-image: url("http://localhost:3000/static/user_cover.jpg");
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  filter: blur(1px);
}

.header-cover-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  background: linear-gradient(180deg, transparent 0, rgba(0, 0, 0, .03) 8%, rgba(0, 0, 0, .11) 21%, rgba(0, 0, 0, .61) 78%, rgba(0, 0, 0, .7) 95%, rgba(0, 0, 0, .7))
}

.user-details {
  display: flex;
  flex-direction: row;
  gap: 16px;
  padding: 16px;
  align-items: center;
  z-index: 10;
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
  gap: 16px;
  font-size: small;
  padding: 16px;
  z-index: 10;
  flex-grow: 2;
}

.user-stat-label {
  display: flex;
  gap: 8px;
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
