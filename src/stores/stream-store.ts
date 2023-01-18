import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { readonly, ref } from 'vue';
import { useQuasar } from 'quasar';
import { ArtworkPreview } from 'src/models/artwork-preview';

export const useStreamStore = defineStore('stream', () => {
  const artworks = ref<ArtworkPreview[]>([]);
  const q = useQuasar();

  async function clearStream() {
    artworks.value = [];
  }

  async function updateStream(
    userAlias: string,
    since: string,
    latest: string
  ) {
    try {
      const response = await api.get<{
        Artworks: ArtworkPreview[];
        NewArtworks: ArtworkPreview[];
        DeletedIds: string[];
      }>(`/users/${userAlias}/stream`, { params: { since, latest } });
      artworks.value.push(...response.data.Artworks);
    } catch (e) {
      q.notify({ type: 'negative', message: 'Couldn\'t update the stream' });
    }
  }

  return { artworks: readonly(artworks), updateStream, clearStream };
});
