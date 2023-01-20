import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';
import { api } from 'boot/axios';
import { useUserStore } from 'stores/user-store';
import { ArtworkComment } from 'src/models/artwork-comment';
import { Artwork } from 'src/models/artwork';

export const useArtworkStore = defineStore('artwork', () => {
  const artwork = ref<Artwork>({} as Artwork);
  const comments = ref<ArtworkComment[]>([]);

  // Populates the store's `artwork` with its details.
  async function setArtwork(id: string): Promise<void> {
    artwork.value = { ...(await api.get<Artwork>(`/artworks/${id}/data`)).data, Id: id };
  }

  async function getImageBlob(id: string): Promise<Blob | MediaSource> {
    return (
      await api.get(`/artworks/${id}/image`, { responseType: 'blob' })
    ).data;
  }

  // Populates the store's comments.
  async function getComments(id: string): Promise<void> {
    comments.value = (await api.get<ArtworkComment[]>(`/artworks/${id}/comments`)).data;
  }

  async function updateTitle(newTitle: string) {
    await api.put(`/artworks/${artwork.value.Id}/title`, { Title: newTitle });
    artwork.value.Title = newTitle;
  }

  async function removeArtwork() {
    await api.delete(`/artworks/${artwork.value?.Id}`);
    clear();
  }

  function clear() {
    artwork.value = {} as Artwork;
    comments.value = [];
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
    removeComment,
    clear
  };
});
