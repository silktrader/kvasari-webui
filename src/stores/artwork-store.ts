import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';
import { api } from 'boot/axios';
import { useUserStore } from 'stores/user-store';
import { ArtworkComment } from 'src/models/artwork-comment';

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
  const comments = ref<ArtworkComment[]>([]);

  async function setArtwork(id: string) {
    artwork.value = { ...(await getData(id)), Id: id };
  }

  async function getData(id: string) {
    return (await api.get<Artwork>(`/artworks/${id}/data`)).data;
  }

  async function getImageBlob(artworkId: string): Promise<Blob | MediaSource> {
    return (
      await api.get(`http://localhost:3000/artworks/${artworkId}/image`, {
        responseType: 'blob'
      })
    ).data;
  }

  async function updateTitle(newTitle: string) {
    if (!artwork.value) {
      throw new Error('Undefined artwork');
    }
    await api.put(`/artworks/${artwork.value.Id}/title`, { Title: newTitle });
    artwork.value.Title = newTitle;
  }

  async function removeArtwork() {
    await api.delete(`/artworks/${artwork.value?.Id}`);
    artwork.value = undefined;
    comments.value = [];
  }

  async function getComments() {
    comments.value = (await api.get<ArtworkComment[]>(`/artworks/${artwork.value?.Id}/comments`)).data;
  }

  async function addComment(contents: string): Promise<void> {
    const { user } = useUserStore(); // this isn't reactive
    const response = await api.post<{ Id: string; Date: Date }>(`/artworks/${artwork.value?.Id}/comments`, {
      Comment: contents
    });
    comments.value.push({
      Id: response.data.Id,
      AuthorAlias: user.Alias,
      AuthorName: user.Name,
      Comment: contents,
      Date: response.data.Date
    });
  }

  async function removeComment(comment: ArtworkComment): Promise<void> {
    await api.delete(`/artworks/${artwork.value?.Id}/comments/${comment.Id}`);
    comments.value = [...comments.value.filter(c => c.Id !== comment.Id)];
  }

  return {
    artwork: readonly(artwork),
    setArtwork,
    getImageBlob,
    updateTitle,
    removeArtwork,
    comments,
    getComments,
    addComment,
    removeComment
  };
});
