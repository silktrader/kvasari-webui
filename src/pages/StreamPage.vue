<template>
  <q-page class='stream-container'>
    <header class='stream-header'>
      <p class='stream-controls'>
        Your stream of
        <q-select v-model='selectedArt' :options='artOptions' borderless dense hide-dropdown-icon />
        conceived by
        <q-select v-model='selectedSource' :options='sourceOptions' borderless dense hide-dropdown-icon />
        artists, in
        <q-select v-model='selectedOrder' :options='orderOptions' borderless dense hide-dropdown-icon />
        order:
      </p>
    </header>
    <q-infinite-scroll :offset='100' class='previews' debounce='200' @load='onLoad'>
      <artwork-preview-component v-for='artwork in ss.artworks' :key='artwork.Id' :artwork='artwork'
                                 :author='artwork.Author' />

      <!--fills the remaining flex row-->
      <section class='spacer' />
      <!--adds one more row-->
      <section class='empty-preview-row'>
        <q-btn v-if='ss.exhaustedStream' color='secondary' label='Update Stream' outline size='lg'
               @click='update' />
      </section>
      <template v-slot:loading>
        <q-spinner-dots color='primary' size='5em' />
      </template>
    </q-infinite-scroll>

  </q-page>

</template>

<script lang='ts' setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useStreamStore } from 'stores/stream-store';
import { useUserStore } from 'stores/user-store';
import ArtworkPreviewComponent from 'components/ArtworkPreviewComponent.vue';
import { useQuasar } from 'quasar';

const ss = useStreamStore();
const us = useUserStore();
const q = useQuasar();

const enum source {Followed = 'followed', Random = 'random', Unpopular = 'unpopular'}

const enum art {Artworks = 'artworks', Paintings = 'paintings', Sculptures = 'sculptures'}

const enum order {ReverseChronological = 'reverse chronological', Chronological = 'chronological', Random = 'random'}

const sourceOptions = [
  { label: 'followed', value: source.Followed, description: 'whatever' },
  { label: 'random', value: source.Random, disable: true },
  { label: 'unpopular', value: source.Unpopular, disable: true }];
const selectedSource = ref(source.Followed);

const artOptions = [
  { label: 'artworks', value: art.Artworks },
  { label: 'paintings', value: art.Paintings, disable: true },
  { label: 'sculptures', value: art.Sculptures, disable: true }];
const selectedArt = ref(art.Artworks);

const orderOptions = [
  { label: 'reverse chronological', value: order.ReverseChronological },
  { label: 'chronological', value: order.Chronological, disable: true },
  { label: 'random', value: order.Random, disable: true }];
const selectedOrder = ref(order.ReverseChronological);

onMounted(() => {
  ss.clear();
});

onUnmounted(() => {
  ss.clear();
});

async function onLoad(index: number, done: (flag?: boolean) => void): Promise<void> {
  try {
    await ss.updateStream(us.user.Alias, ss.earliestArtworkDate);
  } catch (e) {
    q.notify({ type: 'negative', message: 'An error occurred while fetching new artworks.' });
    console.error(e);
  }
  ss.exhaustedStream ? done(true) : done();
}

async function update(): Promise<void> {
  try {
    await ss.updateStream(us.user.Alias, ss.earliestArtworkDate);
  } catch (e) {
    q.notify({ type: 'negative', message: 'An error occurred while updating the stream.' });
    console.error(e);
  }
}

</script>

<style lang='scss' scoped>

@import '../css/quasar.variables.scss';

$border-radius: 3px;

.stream-container {
  padding-top: $toolbar-padding + 30;
}

.stream-header {
  position: relative;
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: flex-end;
  padding-left: 20%;
}

.stream-controls {
  display: flex;
  align-items: baseline;
  font-size: x-large;
  font-style: italic;
  font-family: 'Montserrat', serif;
  gap: 1ch;

  label {
    font-size: inherit;
    font-family: inherit;
    text-decoration: underline;
  }
}

.previews {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: $padding;
  justify-content: center; // needed for the spinner, but potential issue
}

.spacer {
  flex-grow: 10;
}

.empty-preview-row {
  display: flex;
  justify-content: center;
  padding-top: 32px;
  padding-bottom: 16px;
  width: 100%;
}

</style>
