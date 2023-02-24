<template>

  <section v-if='artwork' class='artwork-image'>
    <!--the id serves as a scrolling target-->
    <img id='image' :alt='artwork.Title' :src='imgUrl' class='shadow-20'>

    <div class='caption ui'>
      <q-btn :class='captionBox' class='caption-box info-button' flat square @click='scrollToDetails'>
        <div class='caption-box-label'>i</div>
      </q-btn>
      <div :class='captionTextClass' class='caption-text'>
        <span>{{ artwork.Title || 'Untitled' }}</span>
        <span v-show='artwork.Author.Name' class='author-name'>, by {{ artwork.Author.Name }}</span>
      </div>
      <div style='flex-grow: 10'></div>
    </div>

  </section>

  <section v-if='artwork' id='details' class='artwork-details'>

    <div class='details-header'>
      <q-btn class='caption-box close-button' flat icon='close' square @click='scrollToImage' />
      <span class='details-title'>
        {{ detailsTitle }}
      </span>

      <!--Title Editing-->
      <q-btn v-if='isEditing' class='title-edit' color='accent' icon='edit' outline round>
        <q-popup-edit v-slot='scope'
                      v-model='artwork.Title'
                      :cover='false'
                      :offset='[0, 10]'
                      :validate='v => !!v'
                      @save='updateTitle'>
          <q-input v-model='scope.value'
                   autofocus
                   color='accent'
                   counter
                   dense
                   spellcheck='false'
                   style='width: 50ch'
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

    </div>

    <section v-intersection='onShowDetails' class='details-description'>
      {{ artwork.Description }}
    </section>

    <section class='details-meta'>

      <div class='artist'>
        <q-avatar size='120px' @click='goToArtist'>
          <img alt='User Avatar'
               class='artist-avatar'
               src='https://artincontext.org/wp-content/uploads/2021/03/Famous-Self-Portraits-848x530.jpg'>
          <q-badge v-if='artwork.Author.FollowsUser' class='user-avatar-badge' color='secondary' floating
                   label='Follows You' />
        </q-avatar>

        <aside v-if='isOwner' class='user-name-alias' @click='goToArtist'>
          <span><em>You</em></span>
        </aside>

        <aside v-else class='user-name-alias' @click='goToArtist'>
          <span>{{ artwork.Author.Name }}</span>
          <span class='artist-alias'>@{{ artwork.Author.Alias }}</span>
        </aside>

        <!-- Owner or viewer contextual controls -->
        <section class='controls'>
          <q-toggle
            v-if='isOwner'
            v-model='isEditing'
            color='accent'
            icon='edit'
            size='xl'
          />
          <q-btn v-show='canDelete' color='negative' label='Delete' @click='removeArtwork' />
          <q-btn v-if='canFollow' color='primary' label='Follow' outline @click='follow' />
          <q-btn v-else-if='canUnfollow' color='primary' label='Unfollow' outline @click='unfollow' />
        </section>

      </div>

      <div class='meta'>
        <span class='meta-detail'><q-icon name='las la-image' size='md' />{{ formatType(artwork.Type) }}</span>
        <span class='meta-detail'><q-icon name='las la-landmark' size='md' />{{ artwork.Location ?? 'Unknown Location'
          }}</span>
        <span class='meta-detail'><q-icon name='las la-copyright' size='md' /> Public Domain</span>

      </div>

      <div class='dates'>
        <aside class='dates-date'><span>Dating:</span><span>{{ dating }}</span></aside>
        <aside class='dates-date'><span>Added:</span><span>{{ formatLongDate(artwork.Added) }}</span></aside>
        <aside class='dates-date'><span>Updated:</span><span>{{ formatLongDate(artwork.Updated) }}</span></aside>
      </div>

    </section>


  </section>

</template>

<script lang='ts' setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { date, scroll, useQuasar } from 'quasar';
import utilities from 'src/utilities/utilities';
import { useUserStore } from 'stores/user-store';
import { useArtworkStore } from 'stores/artwork-store';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { BadRequestError } from 'boot/axios';

const q = useQuasar();
const us = useUserStore();
const as = useArtworkStore();
const router = useRouter();

let timer: any = null;
let uiElems: any[] = [];
let hiddenUi = false;

const { artwork } = storeToRefs(as);

// Determines whether the artwork is being edited by the user, which triggers various controls.
const isEditing = ref(false);

const imgUrl = ref<string>('');
const detailsVisible = ref<boolean>(false);
const { getScrollTarget, setVerticalScrollPosition } = scroll;

const dating = computed(() => {
  if (artwork.value?.Created) {
    return date.formatDate(artwork.value.Created, 'YYYY-MM-DD');
  }
  if (artwork.value?.Year) {
    return `${artwork.value.Year} ca.`;
  }
  return 'Unknown';
});

const detailsTitle = computed(() => {
  const creation: number | undefined = artwork.value?.Created
    ? new Date(artwork.value.Created).getFullYear()
    : artwork.value?.Year;
  return `${artwork.value?.Title ?? 'Untitled'}${creation ? ', ' + creation : ''}`;
});

// CSS classes handling scroll visibility
const captionBox = computed(() => detailsVisible.value ? 'inactive-box' : 'active-box');
const captionTextClass = computed(() => detailsVisible.value ? 'caption-text-hidden' : '');

// Determines whether the viewing user matches the artwork's artist.
const isOwner = computed(() => artwork.value && artwork.value.Author.Alias === us.user?.Alias);

// Determines whether the author can be followed by the user.
const canFollow = computed(() => !isOwner.value && !artwork.value?.Author.FollowedByUser);

// Determines whether the author can be unfollowed by the user.
const canUnfollow = computed(() => !isOwner.value && artwork.value?.Author.FollowedByUser);

// Determines whether the user can delete the artwork.
const canDelete = computed(() => isOwner.value && isEditing.value);

// a valid target to scroll to
const imageTarget = getScrollTarget(document.getElementById('image') as HTMLElement);

onMounted(async () => {
  imgUrl.value = URL.createObjectURL(await as.getImageBlob(as.artwork.Id));
  uiElems = Array.prototype.slice.call(document.querySelectorAll('.ui'));
  window.addEventListener('mousemove', restartTimer, false);
  timer = setTimeout(() => {
    hideUiElements();
  }, 2500);
});

onBeforeUnmount(() => {
  URL.revokeObjectURL(imgUrl.value);
  window.removeEventListener('mousemove', restartTimer, false);
  clearTimeout(timer);
});

function restartTimer(): void {
  clearTimeout(timer);
  if (hiddenUi) showUiElements();
  timer = setTimeout(() => {
    hideUiElements();
  }, 2500);
}

function hideUiElements(): void {
  uiElems.forEach(e => e.classList.add('hide'));
  hiddenUi = true;
}

function showUiElements(): void {
  uiElems.forEach(e => e.classList.remove('hide'));
  hiddenUi = false;
}

function onShowDetails(e: { isIntersecting: boolean; }): void {
  detailsVisible.value = e.isIntersecting;
}

function scrollToImage(): void {
  setVerticalScrollPosition(imageTarget, 0, 300);
}

function scrollToDetails(): void {
  window.scrollTo({
    top: document.getElementById('details')?.offsetTop,
    left: window.scrollX,
    behavior: 'smooth'
  });
}

// this should be localised ideally
function formatType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

// Prints a date of the form: Saturday, 21st of January 2022
const formatLongDate = (date: string) => utilities.FormatLongDate(date);

// Attempts to edit the artwork's title.
async function updateTitle(newTitle: string): Promise<void> {
  try {
    await as.updateTitle(newTitle);
    q.notify({
      type: 'positive',
      message: `Title changed to <b>${newTitle}</b>`,
      html: true
    });
  } catch (e) {
    q.notify({
      type: 'negative',
      message: 'Couldn\'t update the artwork\'s title'
    });
  }
}

async function removeArtwork(): Promise<void> {
  try {
    // cache name before flushing store
    const identifier = artwork.value.Title ?? 'Untitled';
    await as.removeArtwork();
    router.back();
    q.notify({ type: 'positive', message: `Removed ${identifier}.`, html: true });
  } catch (e) {
    if (e instanceof BadRequestError) {
      q.notify({ type: 'negative', message: 'Error while removing the artwork: </br>${e.Message}', html: true });
    }
    console.error(e);
  }
}

function goToArtist(): void {
  if (artwork.value) router.push(`/${artwork.value.Author.Alias}`);
}

function follow(): void {
  try {
    us.followArtist(artwork.value.Author.Alias);
    as.follow();
    q.notify({
      type: 'positive',
      message: `You now follow <b>${artwork.value.Author.Alias}</b>.`,
      html: true
    });
  } catch (e) {
    console.error(e);
    q.notify({
      type: 'negative',
      message: `A problem arose while attempting to follow <b>${artwork.value.Author.Alias}</b>`,
      html: true
    });
  }
}

function unfollow(): void {
  try {
    us.unfollowArtist(artwork.value.Author.Alias);
    as.unfollow();
    q.notify({
      type: 'positive',
      message: `You stopped following <b>${artwork.value.Author.Alias}</b>.`,
      html: true
    });
  } catch (e) {
    console.error(e);
    q.notify({
      type: 'negative',
      message: `A problem arose while unfollowing <b>${artwork.value.Author.Alias}</b>`,
      html: true
    });
  }
}

</script>

<style lang='scss' scoped>

@import '../css/quasar.variables.scss';

.artwork-image {
  position: relative; // must set to absolute for the caption to be absolute
  background-color: #3D3D3D;
  display: flex;
  justify-content: center;
  height: 100vh;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

#image {
  object-fit: contain;
  height: 100vh;
  max-width: 99vw;
}

// caption

.caption {
  position: absolute;
  bottom: 0;
  width: 100%;
  color: white;
  display: flex;
  font-family: 'Arapey', serif;
  //text-shadow: 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black;
  font-size: x-large;
  gap: 15px;
}

.active-box {
  color: #121212;
  background-color: white;
}

.inactive-box {
  background-color: rgb(0, 0, 0, 0.5);
  color: white;
}

.caption-box {
  margin-left: 30%;
  width: 2.5rem;
  height: 2.5rem;
  font-weight: bolder !important;
  transition: background-color 1s ease;
}

.caption-text {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  font-weight: 500;
  opacity: 1;
  transition: opacity 1s ease;
}

.caption-text-hidden {
  opacity: 0;
}

.info-button {
  border-top-right-radius: 2px;
  border-top-left-radius: 2px;
  border-bottom: 0;
}

.close-button {
  border-bottom-right-radius: 2px;
  border-bottom-left-radius: 2px;
  border-top: 0;
  background-color: white;
  color: #121212;
}

.caption-box-label {
  font-size: x-large;
  text-transform: none;
  font-style: italic;
}

.author-name {
  font-style: italic;
  opacity: 75%;
}

// details
// header

.artwork-details {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  font-family: $text-sans;
  font-size: medium;
  color: white;
  align-items: center;
  gap: 2rem;
  width: 100%;
}

.details-header {
  display: flex;
  flex-direction: row;
  gap: 16px;
  width: 100%;
  font-family: $text-serif;
  z-index: 10;
}

.details-title {
  font-size: xx-large;
  font-family: $text-serif;
}

.title-edit {
  align-self: center;
  width: 2.5rem;
  height: 2.5rem;
}

// description

.details-description {
  font-family: $text-serif;
  //color: antiquewhite;
  font-size: large;
  max-width: 500px;
  text-align: justify;
}

// meta

.details-meta {
  display: flex;
  flex-direction: row;
  width: 90%;
  justify-content: space-evenly;
}

.artist {
  display: flex;
  flex-direction: column;
  width: 120px; // matches the avatar's width
  cursor: pointer;
}

.artist-avatar {
  object-fit: cover;
}

.user-avatar-badge {
  padding: 6px;
}

.user-name-alias {
  display: flex;
  flex-direction: column;
  font-family: $text-serif;
  font-size: large;
  text-align: center;
  margin-top: 1rem;
  margin-bottom: 2rem;
  gap: 10px;
}

.user-name-alias:hover {
  text-decoration: underline;
}

.artist-alias {
  font-size: medium;
  font-style: italic;
}

.meta, .dates {
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: space-evenly;
}

.meta {
  width: 200px;
}

.meta-detail {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.dates-date {
  display: flex;
  justify-content: space-between;

  span:last-of-type {
    font-style: italic;
    padding-left: 2ch;
  }
}

.controls {
  //height: 150px; // makes room for edit controls
  width: 100%;
  display: flex;
  flex-direction: column;
}

</style>
