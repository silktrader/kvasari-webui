<template>

  <section class='preview' @click='navigateTo(artwork.Id)'>
    <img :src='imgUrl' :alt='imgAlt' />
    <aside class='overlay'>

      <section class='metadata'>
        <div class='metadata-space' />
        <span class='title'>{{ artwork.Title }}</span>
        <span v-if='!isUser' class='artist'>{{ artwork.AuthorName }}</span>
        <div class='metadata-space' />
        <span class='added'>added {{ formatRelativeDate(artwork.Added) }}</span>
      </section>

      <section class='feedback'>
        <div>
          <q-icon size='sm' name='comment'></q-icon>
          <span>{{ artwork.Comments }}</span>
        </div>
        <div>
          <q-icon size='sm' name='reviews'></q-icon>
          <span>{{ artwork.Reactions }}</span>
        </div>
      </section>

      <!--      <section class='controls'>-->
      <!--        <q-btn round color='primary' icon='more_vert' @click.stop>-->
      <!--          <q-menu>-->
      <!--            <q-list style='min-width: 100px'>-->
      <!--              <q-item clickable v-close-popup @click='onEdit'>-->
      <!--                <q-item-section>Edit</q-item-section>-->
      <!--              </q-item>-->
      <!--              <q-item clickable v-close-popup>-->
      <!--                <q-item-section>Delete</q-item-section>-->
      <!--              </q-item>-->
      <!--            </q-list>-->
      <!--          </q-menu>-->
      <!--        </q-btn>-->
      <!--      </section>-->

    </aside>
  </section>

</template>

<script setup lang='ts'>

import { computed, onBeforeUnmount, onMounted, PropType, ref } from 'vue';
import utilities from 'src/utilities/utilities';
import { useRouter } from 'vue-router';
import { useArtworkStore } from 'stores/artwork-store';
import { useUserStore } from 'stores/user-store';
import { ArtworkPreview } from 'src/models/artwork-preview';

const props = defineProps({
  artwork: Object as PropType<ArtworkPreview>
});

const router = useRouter();
const as = useArtworkStore();
const us = useUserStore();
const imgUrl = ref<string>();

onMounted(async () => {
  if (props.artwork) imgUrl.value = URL.createObjectURL(await as.getImageBlob(props.artwork.Id));
});

onBeforeUnmount(() => {
  if (imgUrl.value) URL.revokeObjectURL(imgUrl.value);
});

const isUser = computed(() => us.user && us.user.Name == props.artwork?.AuthorName);

const imgAlt = computed(() => {
  return `${props.artwork?.Title || 'Untitled'}, by ${props.artwork?.AuthorName}`;
});

function navigateTo(artworkId: string): void {
  router.push(`/artworks/${artworkId}`);
}

function formatRelativeDate(date: Date): string {
  return utilities.FormatRelativeDate(date);
}

function onEdit() {
  console.log('Unimplemented');
}

</script>

<style scoped lang='scss'>

$border-radius: 3px;

.preview {
  height: 30vh;
  cursor: pointer;
  position: relative;
  //flex: 1 1 auto;
}

img {
  object-fit: cover;
  //width: 100%;
  height: 30vh;
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
