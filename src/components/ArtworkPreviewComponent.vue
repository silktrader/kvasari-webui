<template>

  <section class='preview' @click='navigateTo(artwork.Id)'>
    <img :alt="`${artwork.Title ?? 'Untitled'}, by ${props.author?.Name }`" :src='imgUrl' />
    <aside class='overlay'>

      <section class='metadata'>
        <div class='metadata-space' />
        <span class='title'>{{ artwork.Title ?? 'Untitled' }}</span>
        <span v-if='showAuthor' class='artist'>{{ props.author.Name }}</span>
        <div class='metadata-space' />
        <span class='added'>added {{ friendlyDate }}<q-tooltip>Added on {{ formatLongDate(artwork.Added)
          }}</q-tooltip></span>
      </section>

      <section class='overlay-right'>

        <section class='feedback'>
          <div>
            <q-icon name='comment' size='sm'></q-icon>
            <span>{{ artwork.Comments }}</span>
          </div>
          <div>
            <q-icon name='reviews' size='sm'></q-icon>
            <span>{{ artwork.Reactions }}</span>
          </div>
        </section>

        <section v-if='isUserAuthor' class='controls'>
          <q-btn icon='more_vert' outline round @click.stop>
            <q-menu>
              <q-list style='min-width: 100px'>
                <q-item v-close-popup clickable disable @click='editTitle'>
                  <q-item-section>Edit Title</q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click='removeArtwork'>
                  <q-item-section>Delete</q-item-section>
                </q-item>
                <q-separator />
                <q-item v-close-popup clickable>
                  <q-item-section>Dismiss</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </section>

      </section>

    </aside>
  </section>

</template>

<script lang='ts' setup>

import { computed, onBeforeUnmount, onMounted, PropType, ref } from 'vue';
import utilities from 'src/utilities/utilities';
import { useRouter } from 'vue-router';
import { useArtworkStore } from 'stores/artwork-store';
import { useUserStore } from 'stores/user-store';
import { ArtworkPreview } from 'src/models/artwork-preview';
import { useArtistStore } from 'stores/artist-store';
import { useQuasar } from 'quasar';
import { Author } from 'src/models/author';

const props = defineProps({
  artwork: {
    type: Object as PropType<ArtworkPreview>,
    required: true
  },
  author: {
    type: Object as PropType<Author>,
    required: true
  }
});

const router = useRouter();
const as = useArtworkStore();
const ars = useArtistStore();
const us = useUserStore();
const q = useQuasar();
const imgUrl = ref<string>();

onMounted(async () => {
  imgUrl.value = URL.createObjectURL(await as.getImageBlob(props.artwork.Id));
});

onBeforeUnmount(() => {
  if (imgUrl.value) URL.revokeObjectURL(imgUrl.value);
});

// Determines whether the artwork's author and the viewing user match.
// Artwork previews owned by the user lack the nullable `Author` property.
const isUserAuthor = computed(() => props.author.Alias === us.user.Alias);

// Determines whether previews should display the artwork author's full name: stream previews do, profile ones don't.
const showAuthor = computed(() => props.author && props.author.Alias !== ars.artist.Alias);

const friendlyDate = computed(() =>
  us.timer ? utilities.FormatRelativeDate(props.artwork.Added) : null);

const formatLongDate = (date: string) => utilities.FormatLongDate(date);

function navigateTo(artworkId: string): void {
  router.push(`/artworks/${artworkId}`);
}

function editTitle() {
  console.log('Unimplemented');
}

function removeArtwork() {
  const identifier = props.artwork.Title ?? `artwork #${props.artwork.Id}`;
  try {
    ars.removeArtwork(props.artwork);
    q.notify({
      type: 'positive',
      message: `You deleted <b>${identifier}</b>.`,
      html: true
    });
  } catch (e) {
    q.notify({
      type: 'negative',
      message: `An error occurred while deleting <b>${identifier}</b>.`,
      html: true
    });
    console.error(e);
  }
}

</script>

<style lang='scss' scoped>

$border-radius: 3px;

.preview {
  cursor: pointer;
  position: relative;
  height: 30vh;
  flex: 1 1 auto;
  min-width: 180px; // enough to fit the timestamp and two icons on most screens
}

img {
  object-fit: cover;
  width: 100%;
  height: 100%;
  vertical-align: middle;
  border-radius: $border-radius;
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
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  -moz-transition: opacity 0.5s ease-in-out;
  -webkit-transition: opacity 0.5s ease-in-out;
}

.overlay-right {
  display: flex;
  flex-direction: column-reverse;
  height: 100%;
  justify-content: space-between;
  align-items: flex-end;
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
  display: flex;
  align-items: flex-end;
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
