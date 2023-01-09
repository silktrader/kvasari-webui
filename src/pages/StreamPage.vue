<template>
  <q-page class='stream-container'>
    <header class='stream-header'>
      <q-btn-group outline>
        <q-btn outline color='accent' label='Latest' icon='schedule' />
        <q-btn outline color='accent' label='Random' icon='shuffle' disable />
        <q-btn outline color='accent' label='Most Commented' icon='comment' disable />
      </q-btn-group>
    </header>
    <div class='previews'>
      <artwork-preview-component v-for='artwork in streamStore.artworks' :key='artwork.Id'
                                 :artwork='artwork' :author='us.user'></artwork-preview-component>
      <!--      <ul>-->
      <!--        <li v-for='artwork in streamStore.artworks' :key='artwork.Id'-->
      <!--            @click='navigateTo(artwork.Id)'>-->
      <!--          <img :src='artwork.PictureURL' :alt='artwork.Description' />-->
      <!--          <div class='overlay'>-->
      <!--            <div class='metadata'>-->
      <!--              <div class='metadata-space'></div>-->
      <!--              <span class='title'>{{ artwork.Title }}</span>-->
      <!--              <span class='artist'>{{ artwork.AuthorName }}</span>-->
      <!--              <div class='metadata-space'></div>-->
      <!--              <span class='added'>added {{ timeAgo(artwork.Added) }} days ago</span>-->
      <!--            </div>-->
      <!--            <div class='feedback'>-->
      <!--              <div>-->
      <!--                <q-icon size='md' name='comment'></q-icon>-->
      <!--                <span>{{ artwork.Comments }}</span>-->
      <!--              </div>-->
      <!--              <div>-->
      <!--                <q-icon size='md' name='reviews'></q-icon>-->
      <!--                <span>{{ artwork.Reactions }}</span>-->
      <!--              </div>-->
      <!--            </div>-->
      <!--          </div>-->
      <!--        </li>-->
      <!--      </ul>-->

    </div>

  </q-page>

</template>

<script setup lang='ts'>
import { onMounted } from 'vue';
import { useStreamStore } from 'stores/stream-store';
import { date } from 'quasar';
import { useRouter } from 'vue-router';
import { useUserStore } from 'stores/user-store';
import ArtworkPreviewComponent from 'components/ArtworkPreviewComponent.vue';

const router = useRouter();
const streamStore = useStreamStore();
const us = useUserStore();

onMounted(() => {
  const now = new Date().toISOString();
  streamStore.clearStream();
  if (us.user) streamStore.updateStream(us.user.Alias, now, now);
});

function timeAgo(datetime: Date): number {
  return date.getDateDiff(new Date(), datetime, 'days');
}

function navigateTo(artworkId: string): void {
  // router.push({ name: 'artworks', params: { artworkId } });
  router.push(`/artworks/${artworkId}`);
}

</script>

<style scoped lang='scss'>

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
  gap: 16px;
  padding-left: $padding;
  padding-right: $padding;
  padding-top: $toolbar-padding;
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
