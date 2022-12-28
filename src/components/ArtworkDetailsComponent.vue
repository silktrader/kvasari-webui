<template>

  <section class='artwork-image'>
    <!--the id serves as a scrolling target-->
    <img id='image' :src='imgUrl' :alt='artwork.Title' class='shadow-20'>

    <div class='caption'>
      <q-btn square flat class='caption-box info-button' :class='captionBox' @click='scrollToDetails'>
        <div class='caption-box-label'>i</div>
      </q-btn>
      <div class='caption-text' :class='captionTextClass'>
        <span>{{ artwork.Title || 'Untitled' }}</span>
        <span class='author-name' v-show='artwork.AuthorName'>, by {{ artwork.AuthorName }}</span>
      </div>
      <div style='flex-grow: 10'></div>
    </div>

  </section>

  <section class='artwork-details' id='details'>

    <div class='details-header'>
      <q-btn square flat icon='close' class='caption-box close-button' @click='scrollToImage'>
      </q-btn>
      <span class='details-title'>
        {{ detailsTitle }}
      </span>
    </div>

    <section class='details-description' v-intersection='onShowDetails'>
      {{ artwork.Description }}
    </section>

    <section class='details-meta'>

      <div class='artist'>
        <q-avatar size='120px'>
          <img src='https://artincontext.org/wp-content/uploads/2021/03/Famous-Self-Portraits-848x530.jpg'
               class='artist-avatar'>
        </q-avatar>
        <aside class='user-name-alias'>
          <span>{{ artwork.AuthorName }}</span>
          <span class='artist-alias'>@{{ artwork.AuthorAlias }}</span>
        </aside>
        <q-btn outline color='primary' label='Follow' />
      </div>

      <div class='meta'>
        <span class='meta-detail'><q-icon name='las la-image' size='md' />{{ formatType(artwork.Type) }}</span>
        <span class='meta-detail' v-if='artwork.Location'><q-icon name='las la-landmark' size='md' />{{ artwork.Location
          }}</span>
        <span class='meta-detail'><q-icon name='las la-copyright' size='md' /> Public Domain</span>

      </div>

      <div class='dates'>
        <aside class='dates-date'><span>Dating:</span><span>{{ dating }}</span></aside>
        <aside class='dates-date'><span>Added:</span><span>{{ formatRelativeDate(artwork.Added) }}</span></aside>
        <aside class='dates-date'><span>Updated:</span><span>{{ formatRelativeDate(artwork.Updated) }}</span></aside>
      </div>

    </section>


  </section>

</template>

<script setup lang='ts'>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { api } from 'boot/axios';
import { date, scroll } from 'quasar';
import utilities from 'src/utilities/utilities';

interface Artwork {
  AuthorName: string;
  AuthorAlias: string;
  Title: string;
  Description: string;
  PictureUrl: string;
  Location: string;
  Year: number;
  Type: 'Like' | 'Perplexed'; // tk
  Created: Date;
  Added: Date;
  Updated: Date;
  Comments: number;
  Reactions: number;
  Url: string;
}

const props = defineProps<{ artworkId: string }>();

let artwork: Readonly<Artwork>;

const imgUrl = ref<string>('');
const detailsVisible = ref<boolean>(false);
const { getScrollTarget, setVerticalScrollPosition } = scroll;

const getDetails = async () => {
  // tk use param object
  const response = await api.get<Artwork>(`/artworks/${props.artworkId}`);
  artwork = reactive(response.data);
};

await getDetails();

const dating = computed(() => {
  if (artwork.Created) {
    return date.formatDate(artwork.Created, 'YYYY-MM-DD');
  }
  if (artwork.Year) {
    return `${artwork.Year} ca.`;
  }
  return 'Unknown';
});

const detailsTitle = computed(() => {
  const creation: number = artwork.Created ? new Date(artwork.Created).getFullYear() : artwork.Year;
  return `${artwork.Title ?? 'Untitled'}${creation ? ', ' + creation : ''}`;
});

// CSS classes handling scroll visibility
const captionBox = computed(() => detailsVisible.value ? 'inactive-box' : 'active-box');
const captionTextClass = computed(() => detailsVisible.value ? 'caption-text-hidden' : '');

// a valid target to scroll to
const imageTarget = getScrollTarget(document.getElementById('image') as HTMLElement);

onMounted(async () => {
  imgUrl.value = URL.createObjectURL(await api.get(`http://localhost:3000/artworks/${props.artworkId}/image`, { responseType: 'blob' }).then(response => response.data));
});

onBeforeUnmount(() => {
  URL.revokeObjectURL(imgUrl.value);
});

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

function formatRelativeDate(date: Date): string {
  return utilities.FormatRelativeDate(date);
}

</script>

<style scoped lang='scss'>

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
  width: 100%;
  font-family: $text-serif;
  z-index: 10;
}

.details-title {
  margin-left: 1rem;
  font-size: xx-large;
  font-family: $text-serif;
}

// description

.details-description {
  font-family: $text-sans;
  color: antiquewhite;
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
}

.artist-avatar {
  object-fit: cover;
}

.user-name-alias {
  display: flex;
  flex-direction: column;
  text-align: center;
  margin-top: 1rem;
  margin-bottom: 2rem;
  gap: 10px;
  font-size: medium;
}

.artist-alias {
  font-size: small;
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

</style>
