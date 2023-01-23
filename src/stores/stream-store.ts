import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { readonly, ref } from 'vue';
import { ArtworkStreamPreview } from 'src/models/artwork-preview';

export const useStreamStore = defineStore('stream', () => {
  const artworks = ref<ArtworkStreamPreview[]>([]);

  const now = () => new Date().toISOString();

  // Tracks whence to get the next artworks from.
  const earliestArtworkDate = ref<string>(now());

  // Signals the time when the last request succeeded, to help paginate results.
  const lastRequest = ref<string>(now());

  // Determines whether there are more artworks to fetch.
  const exhaustedStream = ref<boolean>(false);

  // Initialises the store with empty data and sensible defaults.
  async function clear() {
    artworks.value = [];
    earliestArtworkDate.value = now();
    lastRequest.value = now();
  }

  // Updates a collection of artworks, ordered from oldest to most recent. Returns three collections:
  //  - artworks older than the latest fetched one
  //  - artworks added after the last request timestamp
  //  - IDs of artworks deleted but possibly displayed
  async function updateStream(userAlias: string, latest: string) {
    const { data } = await api.get<{
      Artworks: ArtworkStreamPreview[];
      NewArtworks: ArtworkStreamPreview[];
      DeletedIds: string[];
    }>(`/users/${userAlias}/stream`, { params: { since: lastRequest.value, latest } });

    // update the last request's timestamp so future requests can account for new and deleted artworks
    lastRequest.value = now();

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
