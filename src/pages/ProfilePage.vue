<template>
  <q-page class='profile-container'>

    <div class='profile-header'>
      <div class='header-cover'></div>
      <div class='header-cover-gradient'></div>

      <section class='user-details'>
        <q-avatar size='120px'>
          <img alt='User Profile Cover'
               class='user-avatar'
               src='https://artincontext.org/wp-content/uploads/2021/03/Famous-Self-Portraits-848x530.jpg'>
        </q-avatar>

        <section class='user-name-alias'>
          <div class='name'>
            <span>{{ artist.Name }}</span>

            <!-- Name editing shortcut for the profile owner -->
            <q-btn v-if='isUser' icon='las la-user-edit' outline round>
              <q-tooltip>
                Edit your name
              </q-tooltip>
              <q-popup-edit v-slot='scope'
                            v-model='artist.Name'
                            :cover='false'
                            :offset='[0, 10]'
                            :validate='v => v && v.length > 6'
                            @save='saveUserName'>
                <q-input v-model='scope.value'
                         :rules="[val => scope.validate(val) || 'More than six characters required']"
                         autofocus
                         color='accent'
                         counter
                         dense
                         spellcheck='false'
                         style='width: 35ch'
                         @keyup.enter='scope.set'>
                  <template v-slot:prepend>
                    <q-icon color='accent' name='edit' />
                  </template>
                  <template v-slot:after>
                    <q-btn
                      dense flat icon='cancel'
                      @click.stop.prevent='scope.cancel'
                    />

                    <q-btn
                      :disable='scope.validate(scope.value) === false || scope.initialValue === scope.value' dense flat
                      icon='check_circle'
                      @click.stop.prevent='scope.set'
                    />
                  </template>
                </q-input>
              </q-popup-edit>
            </q-btn>

            <!-- Relevant controls when viewing another user's profile -->
            <q-btn v-if='canFollow' label='Follow' outline rounded @click='follow()'></q-btn>
            <q-btn v-else-if='canUnfollow' label='Unfollow' outline rounded @click='unfollow()'></q-btn>
            <q-btn v-else-if='canUnblock' label='Unblock' outline rounded @click='unblock()'></q-btn>

            <section v-if='!isUser'>
              <q-btn flat icon='more_vert' round @click.stop>
                <q-menu>
                  <q-list>
                    <q-item v-if='!canUnblock' v-close-popup v-ripple clickable @click='block'>
                      <q-item-section avatar>
                        <q-icon name='block' />
                      </q-item-section>
                      <q-item-section>Block</q-item-section>
                    </q-item>
                    <q-item v-close-popup v-ripple clickable disable>
                      <q-item-section avatar>
                        <q-icon name='report' />
                      </q-item-section>
                      <q-item-section>Report</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </section>

          </div>
          <span class='alias'>@{{ artist.Alias }}</span>
        </section>
      </section>

      <section class='user-stats'>
        <q-btn flat no-caps><span class='user-stat-label'><b>{{ artist.Followers }}</b> Followers</span>
          <q-tooltip>
            Users who follow {{ artist.Name }}
          </q-tooltip>
        </q-btn>
        <q-btn flat no-caps><span class='user-stat-label'><b>{{ artist.Following }}</b> Following</span>
          <q-tooltip>
            Users followed by {{ artist.Name }}
          </q-tooltip>
        </q-btn>
        <q-btn flat no-caps><span class='user-stat-label'><b>{{ artist.Artworks }}</b> Artworks</span>
          <q-tooltip>
            Artworks uploaded by {{ artist.Name }}
          </q-tooltip>
        </q-btn>
        <span style='flex-grow: 3'></span>
        <q-btn dense flat no-caps>
          <span class='user-stat-label'>
            <b>{{ artist.Comments }}</b>
            <q-icon name='comment' />
            <q-tooltip>
            Comments <i>received</i> by {{ artist.Name }}
          </q-tooltip>
          </span>
        </q-btn>

        <q-btn dense flat no-caps>
          <span class='user-stat-label'>
            <b>{{ artist.Reactions }}</b>
            <q-icon name='recommend' />
            <q-tooltip>
            Reactions <i>received</i> by {{ artist.Name }}
          </q-tooltip>
          </span>
        </q-btn>
        <span style='flex-grow: 1'></span>

      </section>
    </div>

    <div>
      <div class='uploads-previews'>
        <div v-if='isUser' class='uploader'>
          <q-uploader
            ref='uploader'
            :accept='acceptableFormats.join(", ")'
            :form-fields='[
              {name: "alias", value: us.user.Alias}
            ]'
            :headers="[{name: 'Authorization', value: getBearerToken()}]"
            :max-file-size='maxFileSize'
            :url='`${baseUrl}/artworks`'
            field-name='image'
            flat
            label='Upload Artwork'
            multiple
            @failed='onFailed'
            @finish='onFinished'
            @rejected='onRejected'
            @uploaded='onUploaded'
          />
        </div>

        <artwork-preview-component v-for='[id, artwork] in artworks' :key='id' :artwork='artwork' :author='as.artist' />

        <div class='spacer' />

      </div>

    </div>

  </q-page>

</template>

<script lang='ts' setup>
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useUserStore } from 'stores/user-store';
import { useArtistStore } from 'stores/artist-store';
import { BadRequestError, baseUrl, getBearerToken, NotFoundError } from 'boot/axios';
import ArtworkPreviewComponent from 'components/ArtworkPreviewComponent.vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

const route = useRoute();
const router = useRouter();
const as = useArtistStore();
const us = useUserStore();
const q = useQuasar();
const uploader = ref();

const maxFileSize = 41943040; // ~40MB
const acceptableFormats: ReadonlyArray<string> = ['.jpg', '.jpeg', '.png', '.webp'];

const { artist, artworks } = storeToRefs(as);

// Watch the route parameters for changes on creation. Two possibilities arise:
// 1. `undefined` when the "/me" path is accessed
// 2. `alias` otherwise
watch(
  () => route.params,
  async toParams => {
    try {
      const alias = toParams.alias as string ?? us.user?.Alias;
      as.clear();
      await as.loadArtistData(alias);
      await as.loadArtworks(alias);
    } catch (error) {
      if (error instanceof BadRequestError) {
        q.notify({
          type: 'negative',
          message: `Error while updating the artist's profile: </br><em>${error.Message}</em>.`,
          html: true
        });
      } else if (error instanceof NotFoundError) {
        q.notify({ type: 'negative', message: 'User not found or inaccessible.' });
        window.history.state.back ? router.back() : await router.push(`/${us.user.Alias}`);
      } else {
        q.notify({ type: 'negative', message: 'A server error occurred while fetching the user profile.' });
      }
    }
  },
  { immediate: true }
);

// determines whether the viewing user matches the authenticated one; can be referred to by other computed props.
const isUser = computed(() => as.artist.Alias === us.user?.Alias);

// determines whether the viewing user can follow the target; banned users won't view the profile at all
const canFollow = computed<boolean>(() => !isUser.value && !artist.value.FollowedByUser && !artist.value.BlockedByUser);

// determines whether the viewing user can unfollow the target
const canUnfollow = computed<boolean>(() => !isUser.value && artist.value.FollowedByUser);

// determines whether the viewing user is already blocking the user and can therefore unblock them
const canUnblock = computed<boolean>(() => !isUser.value && artist.value.BlockedByUser);

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

// Displays the number of bytes in a legible format.
function formatSize(bytes: number): string {
  return (bytes / 1048576).toFixed(2) + 'MiB';
}

function truncateFileName(fileName: string): string {
  return fileName.length > 16 ? `${fileName.slice(0, 16)}...` : fileName;
}

type UploadResponse = { files: ReadonlyArray<{ name: string, size: number }>, xhr: { response: string } };

function onUploaded(response: UploadResponse): void {
  const imageData: { Id: string, Format: string, Updated: string } = JSON.parse(response.xhr.response);
  q.notify({
    type: 'positive',
    message: `Uploaded a new artwork (${formatSize(response.files.map(f => f.size).reduce((p, n) => p + n))}).`,
    html: true
  });

  // update the store
  as.addArtwork(imageData.Id, imageData.Format, imageData.Updated);
}

function onRejected(files: ReadonlyArray<{ file: { name: string, size: number } }>): void {
  files.forEach(f => {
    if (f.file.size >= maxFileSize) {
      q.notify({
        type: 'negative',
        message: `<code>${truncateFileName(f.file.name)}</code> is larger than ${formatSize(maxFileSize)}`,
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

// Triggered by a failed artwork upload attempt.
// Can't rely on Axios interceptors; interpret the action's response as either a message (BR) or an error (ISE).
function onFailed(info: { xhr: { response: string } }): void {
  const responseText = JSON.parse(info.xhr.response);
  q.notify({
    type: 'negative',
    message: `A problem arose while uploading the image: <br/>${responseText?.Message ?? responseText?.Error}`,
    html: true
  });
}

function onFinished(): void {
  uploader.value.reset();
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
      message: `A problem arose while attempting to follow <b>${artist.value.Alias}</b>`,
      html: true
    });
  }
}

function unfollow(): void {
  try {
    us.unfollowArtist(artist.value.Alias);
    as.removeUserAsFollower();
    q.notify({
      type: 'positive',
      message: `You stopped following <b>${artist.value.Alias}</b>.`,
      html: true
    });
  } catch (e) {
    console.error(e);
    q.notify({
      type: 'negative',
      message: `A problem arose while unfollowing <b>${artist.value.Alias}</b>`,
      html: true
    });
  }
}

function block(): void {
  try {
    us.blockUser({ TargetAlias: artist.value.Alias });
    as.blockUser();
    q.notify({
      type: 'positive',
      message: `You blocked <b>${artist.value.Alias}</b> from viewing your content and interacting with you.`,
      html: true
    });
  } catch (e) {
    console.error(e);
    q.notify({
      type: 'negative',
      message: `A problem arose while blocking <b>${artist.value.Alias}</b>`,
      html: true
    });
  }
}

function unblock(): void {
  try {
    us.unblockUser(artist.value.Alias);
    as.unblockUser();
    q.notify({
      type: 'positive',
      message: `You unblocked <b>${artist.value.Alias}</b>.`,
      html: true
    });
  } catch (e) {
    console.error(e);
    q.notify({
      type: 'negative',
      message: `A problem arose while unblocking <b>${artist.value.Alias}</b>`,
      html: true
    });
  }
}

</script>

<style lang='scss' scoped>

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
  min-width: 50%; // nasty hack to ensure the same remains the same
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
  gap: 8px;
  padding-left: $padding;
  padding-right: $padding;
  padding-top: $padding;
}

.uploader {
  height: 30vh;
}

.q-uploader {
  height: 30vh;
}

.spacer {
  flex-grow: 10;
}


</style>
