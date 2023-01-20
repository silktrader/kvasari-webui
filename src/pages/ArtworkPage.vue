<template>

  <q-page>

    <suspense>

      <template #default>
        <main v-if='hasArtwork' class='artwork-container'>
          <ArtworkDetailsComponent></ArtworkDetailsComponent>
          <ArtworkReactionsComponent></ArtworkReactionsComponent>
          <ArtworkCommentsComponent></ArtworkCommentsComponent>
        </main>

      </template>

      <template #fallback>
        Loading ...

      </template>
    </suspense>
  </q-page>

</template>

<script lang='ts' setup>
import ArtworkDetailsComponent from 'components/ArtworkDetailsComponent.vue';
import ArtworkCommentsComponent from 'components/ArtworkCommentsComponent.vue';
import ArtworkReactionsComponent from 'components/ArtworkReactionsComponent.vue';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useArtworkStore } from 'stores/artwork-store';
import { useQuasar } from 'quasar';
import { NotFoundError } from 'boot/axios';

const route = useRoute();
const as = useArtworkStore();
const q = useQuasar();

const artworkId = ref<string>();

// watch a getter instead of the whole route
watch(() => route.params.artworkId, async newId => {
  // initialise the store child components rely on; requests can be made in parallel as they are independent
  // clear the store when navigating away
  if (newId) {
    artworkId.value = newId as string;
    await setArtwork(artworkId.value);
    await getComments(artworkId.value);
    await getReactions(artworkId.value);
  } else {
    artworkId.value = undefined;
    as.clear();
  }
}, { immediate: true });

// Determines whether the artwork store has been initialised with basic data.
const hasArtwork = computed(() => !!as.artwork.Id);

// Loads the artwork's data on creation.
async function setArtwork(artworkId: string): Promise<void> {
  try {
    await as.setArtwork(artworkId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      q.notify({ type: 'negative', message: 'Artwork not found.' });
    } else {
      q.notify({ type: 'negative', message: 'Server error while loading the artwork\'s data.' });
    }
  }
}

// Populate the store's comments.
async function getComments(artworkId: string): Promise<void> {
  try {
    await as.getComments(artworkId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      q.notify({ type: 'negative', message: 'Artwork not found.' });
    } else {
      q.notify({ type: 'negative', message: 'Server error while loading the artwork\'s comments.' });
    }
  }
}

async function getReactions(artworkId: string): Promise<void> {
  try {
    await as.getReactions(artworkId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      q.notify({ type: 'negative', message: 'Artwork not found.' });
    } else {
      q.notify({ type: 'negative', message: 'Server error while loading the artwork\'s reactions.' });
    }
  }
}
</script>

<style lang='scss' scoped>

@import '../css/quasar.variables.scss';

.q-page {
  display: flex;
  flex-direction: column;
  background-color: $stone-background;
  //position: absolute;
}

.q-page-container {
  padding: 0;
}

.artwork-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

</style>
