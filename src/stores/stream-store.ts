import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { ref } from 'vue';
import { useQuasar } from 'quasar';

interface Artwork {
  Id: string;
  Title?: string;
  Description: string;
  PictureURL?: string;
  Added: Date;
  AuthorAlias: string;
  AuthorName: string;
  Comments: number;
  Reactions: number;
}

export const useStreamStore = defineStore('stream', () => {
  const artworks = ref<Artwork[]>([]);
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
        Artworks: Artwork[];
        NewArtworks: Artwork[];
        DeletedIds: string[];
      }>(`/users/${userAlias}/stream`, { params: { since, latest } });
      artworks.value.push(...response.data.Artworks);
    } catch (e) {
      q.notify({ type: 'negative', message: "Couldn't update the stream" });
    }
  }

  return { artworks, updateStream, clearStream };
});
