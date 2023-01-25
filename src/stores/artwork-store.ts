import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';
import { api } from 'boot/axios';
import { useUserStore } from 'stores/user-store';
import { ArtworkComment } from 'src/models/artwork-comment';
import { Artwork } from 'src/models/artwork';
import { Reaction, ReactionType } from 'src/models/reaction';

export const useArtworkStore = defineStore('artwork', () => {
  const artwork = ref<Artwork>({} as Artwork);
  const comments = ref<ArtworkComment[]>([]);
  const reactions = ref<ReadonlyArray<Reaction>>([]);

  // Populates the store's `artwork` with its details.
  async function setArtwork(id: string): Promise<void> {
    artwork.value = { ...(await api.get<Artwork>(`/artworks/${id}/data`)).data, Id: id };
  }

  async function getImageBlob(id: string): Promise<Blob | MediaSource> {
    return (await api.get(`/artworks/${id}/image`, { responseType: 'blob' })).data;
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
    reactions.value = [];
  }

  // Populates the store's comments.
  async function getComments(id: string): Promise<void> {
    comments.value = (await api.get<ArtworkComment[]>(`/artworks/${id}/comments`)).data;
  }

  async function addComment(contents: string): Promise<void> {
    const { user } = useUserStore(); // this isn't reactive
    const { data } = await api.post<{ Id: string; Date: Date }>(`/artworks/${artwork.value?.Id}/comments`, {
      Comment: contents
    });
    comments.value.push({
      Id: data.Id,
      AuthorAlias: user.Alias,
      AuthorName: user.Name,
      Comment: contents,
      Date: data.Date
    });
  }

  async function removeComment(comment: ArtworkComment): Promise<void> {
    await api.delete(`/artworks/${artwork.value?.Id}/comments/${comment.Id}`);
    comments.value = [...comments.value.filter(c => c.Id !== comment.Id)];
  }

  async function getReactions(id: string): Promise<void> {
    reactions.value = (await api.get<Reaction[]>(`/artworks/${id}/reactions`)).data;
  }

  async function addReaction(type: ReactionType): Promise<void> {
    const { user } = useUserStore(); // not reactive
    const { data } = await api.put<{ Status: string, Date: Date }>(`/artworks/${artwork.value.Id}/reactions/${user.Alias}`, {
      Reaction: type
    });
    // ensure proper removal of existing user reaction
    reactions.value = [...reactions.value.filter(r => r.AuthorAlias !== user.Alias), {
      AuthorAlias: user.Alias,
      AuthorName: user.Name,
      Reaction: type,
      Date: data.Date
    }];
  }

  async function removeReaction(): Promise<void> {
    const { user } = useUserStore(); // not reactive
    await api.delete(`/artworks/${artwork.value.Id}/reactions/${user.Alias}`);
    reactions.value = [...reactions.value.filter(r => r.AuthorAlias !== user.Alias)];
  }

  function follow(): void {
    artwork.value.Author.FollowedByUser = true;
  }

  function unfollow(): void {
    artwork.value.Author.FollowedByUser = false;
  }

  return {
    artwork: readonly(artwork),
    comments: readonly(comments),
    reactions: readonly(reactions),
    setArtwork,
    getImageBlob,
    updateTitle,
    removeArtwork,
    getComments,
    addComment,
    removeComment,
    clear,
    getReactions,
    addReaction,
    removeReaction,
    follow,
    unfollow
  };
});
