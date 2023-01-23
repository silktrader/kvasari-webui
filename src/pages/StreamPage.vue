<template>
  <q-page class='stream-container'>
    <header class='stream-header'>
      <q-btn-group outline>
        <q-btn color='accent' icon='schedule' label='Latest' outline />
        <q-btn color='accent' disable icon='shuffle' label='Random' outline />
        <q-btn color='accent' disable icon='comment' label='Most Commented' outline />
      </q-btn-group>
    </header>
    <q-infinite-scroll :offset='100' class='previews' debounce='200' @load='onLoad'>
      <artwork-preview-component v-for='artwork in ss.artworks' :key='artwork.Id' :artwork='artwork'
                                 :author='artwork.Author' />

      <!--fills the remaining flex row-->
      <section class='spacer' />
      <!--adds one more row-->
      <section class='empty-preview-row'>
        <q-btn v-if='ss.exhaustedStream' color='secondary' label='Update Stream' size='md' style='min-width: 30vw'
               @click='update' />
      </section>
      <template v-slot:loading>
        <q-spinner-dots color='primary' size='5em' />
      </template>
    </q-infinite-scroll>

  </q-page>

</template>

<script lang='ts' setup>
import { onMounted } from 'vue';
import { useStreamStore } from 'stores/stream-store';
import { useUserStore } from 'stores/user-store';
import ArtworkPreviewComponent from 'components/ArtworkPreviewComponent.vue';
import { useQuasar } from 'quasar';

const ss = useStreamStore();
const us = useUserStore();
const q = useQuasar();

const now = () => new Date().toISOString();

onMounted(() => {
  ss.clear();
});

async function onLoad(index: number, done: any): Promise<void> {
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

.previews {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: $padding;
  padding-right: $padding;
  padding-top: $toolbar-padding;
  justify-content: center; // needed for the spinner, but potential issue
}

.spacer {
  flex-grow: 10;
}

.empty-preview-row {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  padding-bottom: 16px;
  width: 100%;
  height: 10vh;
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
