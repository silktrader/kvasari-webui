import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { readonly, ref } from 'vue';
import { ArtworkStreamPreview } from 'src/models/artwork-preview';

export const useStreamStore = defineStore('stream', () => {
  const artworks = ref<ArtworkStreamPreview[]>([]);

  // Tracks whence to get the next artworks from.
  const earliestArtworkDate = ref<string>(new Date().toISOString());

  const lastRequest = ref<string>(new Date().toISOString());

  // Determines whether there are more artworks to fetch.
  const exhaustedStream = ref<boolean>(false);

  // Initialises the store with empty data and sensible defaults.
  async function clear() {
    artworks.value = [];
    earliestArtworkDate.value = new Date().toISOString();
  }

  async function updateStream(
    userAlias: string,
    latest: string
  ) {
    const { data } = await api.get<{
      Artworks: ArtworkStreamPreview[];
      NewArtworks: ArtworkStreamPreview[];
      DeletedIds: string[];
    }>(`/users/${userAlias}/stream`, { params: { since: lastRequest.value, latest } });

    // update the last request's timestamp so future requests can account for new and deleted artworks
    lastRequest.value = new Date().toISOString();

    // update displayed artworks by including new ones, removing deleted ones and adding newly fetched ones
    artworks.value = [...data.NewArtworks, ...artworks.value.filter(a => !data.DeletedIds.includes(a.Id)), ...data.Artworks];

    // update timestamps to chain future requests
    earliestArtworkDate.value = data.Artworks.at(-1)?.Added ?? earliestArtworkDate.value;

    // signal the end of a stream
    exhaustedStream.value = data.Artworks.length === 0;
  }

  return {
    artworks: readonly(artworks),
    earliestArtworkDate: readonly(earliestArtworkDate),
    exhaustedStream: readonly(exhaustedStream),
    updateStream,
    clear
  };
});
