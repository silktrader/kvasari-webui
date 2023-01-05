<template>

  <q-page>

    <suspense>

      <template #default>
        <main class='artwork-container'>
          <ArtworkDetailsComponent :artwork-id='artworkId'></ArtworkDetailsComponent>
          <ArtworkReactionsComponent :artwork-id='artworkId'></ArtworkReactionsComponent>
          <ArtworkCommentsComponent :artwork-id='artworkId'></ArtworkCommentsComponent>
        </main>

      </template>

      <template #fallback>
        Loading ...

      </template>
    </suspense>
  </q-page>

</template>

<script setup lang='ts'>

import { ref, watch } from 'vue';
import ArtworkDetailsComponent from 'components/ArtworkDetailsComponent.vue';
import { useRoute } from 'vue-router';
import ArtworkCommentsComponent from 'components/ArtworkCommentsComponent.vue';
import ArtworkReactionsComponent from 'components/ArtworkReactionsComponent.vue';


interface Comment {
  Id: string;
  AuthorAlias: string;
  Date: Date;
  Text: string;
}

interface Reaction {
  AuthorAlias: string;
  Type: string;
}

const route = useRoute();

let artworkId = ref<string>('');

// watch a getter instead of the whole route
watch(() => route.params.artworkId, async newId => {
  artworkId.value = newId as string;
}, { immediate: true });

const comments = ref<Comment[]>([]);
const reactions = ref<Reaction[]>([]);


</script>

<style scoped lang='scss'>

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
