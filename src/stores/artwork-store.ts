import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';
import { api } from 'boot/axios';

interface ArtworkResponse {
  Author: Author;
  Title: string;
  Type: string; // tk
  Format: string; // tk
  Description: string;
  Year: number;
  Location: string;
  Created: Date;
  Added: Date;
  Updated: Date;
  Comments: number;
  Reactions: number;
}

interface Author {
  Alias: string;
  Name: string;
  FollowsUser: boolean;
  FollowedByUser: boolean;
}

interface Artwork extends ArtworkResponse {
  Id: string;
}

export const useArtworkStore = defineStore('artwork', () => {
  const artwork = ref<Artwork>();

  async function setArtwork(id: string) {
    artwork.value = { ...(await getData(id)), Id: id };
  }

  async function getData(id: string) {
    return (await api.get<Artwork>(`/artworks/${id}/data`)).data;
  }

  return { artwork: readonly(artwork), setArtwork };
});
