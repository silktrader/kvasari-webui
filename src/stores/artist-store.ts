import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';
import { api } from 'boot/axios';
import { ArtworkPreview } from 'src/models/artwork-preview';

interface UserRelation {
  Alias: string;
  Name: string;
  Date: Date;
}

export interface Artist {
  Alias: string;
  Name: string;
  Email: string;
  Created: Date;
  Followers: number;
  Following: number;
  Artworks: number;
  Reactions: number;
  Comments: number;
  FollowsUser: boolean;
  FollowedByUser: boolean;
  BlockedByUser: boolean;
}

export const useArtistStore = defineStore('artist', () => {
  const artist = ref<Artist>({} as Artist);
  const followers = ref<UserRelation[]>([]);
  const followed = ref<UserRelation[]>([]);

  // Stores artworks uploaded by the artist, fetched by the requester, in reverse chronological order.
  // A Map allows quick deletion of entries and ordered insertion.
  const artworks = ref<Map<string, ArtworkPreview>>(new Map());

  // Tracks whence to get the next artworks from.
  const earliestArtworkDate = ref<string>(new Date().toISOString());

  async function loadArtistData(alias: string): Promise<void> {
    artist.value = { ...(await api.get<Artist>(`/users/${alias}`)).data, Alias: alias };
  }

  function clear(): void {
    artist.value = {} as Artist;
    followers.value = [];
    followed.value = [];
    artworks.value.clear();
    earliestArtworkDate.value = new Date().toISOString();
  }

  // Loads an artist's artworks, in reverse chronological order, keeping track of deletions and new uploads since
  // the last request.
  // The parameter's required to fetch artworks in parallel with the artist's details request, and minimise latency.
  async function loadArtworks(alias: string): Promise<void> {
    const { data } = await api.get<{
      Requested: ArtworkPreview[];
      New: ArtworkPreview[];
      Deleted: string[];
    }>('artworks', {
      params: {
        artist: alias,
        latest: new Date().toISOString(),
        since: earliestArtworkDate.value
      }
    });

    // add artworks in reverse chronological order
    // not deleting the ID property inside the object, for pure convenience
    data.Requested.forEach(artwork => artworks.value.set(artwork.Id, artwork));

    // add newly requested artworks to a temporary collection
    const newArtworks = new Map<string, ArtworkPreview>();
    data.New.forEach(artwork => newArtworks.set(artwork.Id, artwork));

    // remove deleted artworks from current collection
    data.Deleted.forEach(deletedId => artworks.value.delete(deletedId));

    // merge the new items with the current collection to update the latter
    artworks.value = new Map<string, ArtworkPreview>([...newArtworks, ...artworks.value]);

    // update timestamps to chain future requests
    earliestArtworkDate.value = data.Requested.at(-1)?.Added ?? earliestArtworkDate.value;
  }

  // Adds a user uploaded artwork metadata to the store.
  // The API request is delegated to a custom component, which conveniently handles file selection and binary upload.
  function addArtwork(id: string, format: string, updated: string): void {
    const newArtworks = new Map<string, ArtworkPreview>([[id, {
      Added: updated,
      Updated: updated,
      Format: format,
      Id: id,
      Comments: 0,
      Reactions: 0
    }]]);

    // add the recently uploaded artwork to a copy of the currently displayed artworks, without sorting
    artworks.value = new Map<string, ArtworkPreview>([...newArtworks, ...artworks.value]);
  }

  // Carries out artwork delete requests, given IDs, while properly updating the state.
  async function removeArtwork(artwork: ArtworkPreview): Promise<void> {
    await api.delete(`/artworks/${artwork.Id}`);

    // update the state
    artworks.value.delete(artwork.Id);
    artist.value.Artworks -= 1;
    artist.value.Comments -= artwork.Comments;
    artist.value.Reactions -= artwork.Reactions;
  }

  function updateName(newName: string) {
    artist.value.Name = newName;
  }

  // Add the authenticated user as an artist's follower, updating relevant variables.
  function addUserAsFollower(): void {
    artist.value.FollowedByUser = true;
    artist.value.Followers += 1;
  }

  // Remove the authenticated user as an artist's follower, updating relevant variables.
  function removeUserAsFollower(): void {
    artist.value.FollowedByUser = false;
    artist.value.Followers -= 1;
  }

  // Updates the artist's details, on being blocked by the viewing user.
  function blockUser(): void {
    artist.value.FollowsUser = false;
    artist.value.FollowedByUser = false;
    artist.value.Followers -= 1;
    artist.value.BlockedByUser = true;
  }

  function unblockUser(): void {
    artist.value.BlockedByUser = false;
  }

  return {
    artist: readonly(artist),
    artworks: readonly(artworks),
    followers: readonly(followers),
    followed: readonly(followed),
    loadArtistData,
    updateName,
    clear,
    loadArtworks,
    addArtwork,
    removeArtwork,
    addUserAsFollower,
    removeUserAsFollower,
    blockUser,
    unblockUser
  };
});
