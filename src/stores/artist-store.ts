import { defineStore } from 'pinia';
import { reactive, readonly, ref } from 'vue';
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
  const artist = reactive<Artist>({} as Artist);
  const followers = ref<UserRelation[]>([]);
  const followed = ref<UserRelation[]>([]);

  // Stores the artworks uploaded by the targeted artist, and fetched by the requester, in reverse chronological order.
  const artworks = ref<Map<string, ArtworkPreview>>(new Map());

  // Tracks whence to get the next artworks from.
  const earliestArtworkDate = ref<string>(new Date().toISOString());

  async function loadArtistData(alias: string) {
    const response = await api.get<Artist>(`/users/${alias}`);

    // can't assign new object, must use current reference
    Object.assign(artist, response.data);
    artist.Alias = alias;
  }

  function resetArtworks(): void {
    artworks.value.clear();
    earliestArtworkDate.value = new Date().toISOString();
  }

  // Load an artist's artworks, in reverse chronological order, keeping track of deletions and new uploads since the last
  // request.
  // Loading artworks should be performed in parallel to getting artist data, to minimise latency.
  async function loadArtworks(userAlias: string) {
    const response = await api.get<{
      Requested: ArtworkPreview[];
      New: ArtworkPreview[];
      Deleted: string[];
    }>('artworks', {
      params: {
        artist: userAlias,
        latest: new Date().toISOString(),
        since: earliestArtworkDate.value
      }
    });

    // add artworks in reverse chronological order
    // not deleting the ID property inside the object, for pure convenience
    const newArtworks = new Map<string, ArtworkPreview>();
    response.data.New.forEach(newArtwork => newArtworks.set(newArtwork.Id, newArtwork));

    // remove deleted artworks from current collection
    response.data.Deleted.forEach(deletedId => artworks.value.delete(deletedId));

    // add newly request artworks to current collection
    response.data.Requested.forEach(requestedArtwork => artworks.value.set(requestedArtwork.Id, requestedArtwork));

    // merge the new items with the current collection to update the latter
    artworks.value = new Map<string, ArtworkPreview>([...newArtworks, ...artworks.value]);

    // update timestamps to chain future requests
    earliestArtworkDate.value = response.data.Requested.at(-1)?.Added ?? earliestArtworkDate.value;
  }

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
    artist.Artworks -= 1;
    artist.Comments -= artwork.Comments;
    artist.Reactions -= artwork.Reactions;
  }

  function updateName(newName: string) {
    artist.Name = newName;
  }

  // Add the authenticated user as an artist's follower, updating relevant variables.
  function addUserAsFollower(): void {
    artist.FollowedByUser = true;
    artist.Followers += 1;
  }

  // Remove the authenticated user as an artist's follower, updating relevant variables.
  function removeUserAsFollower(): void {
    artist.FollowedByUser = false;
    artist.Followers -= 1;
  }

  // Updates the artist's details, on being blocked by the viewing user.
  function blockUser(): void {
    artist.FollowsUser = false;
    artist.FollowedByUser = false;
    artist.Followers -= 1;
    artist.BlockedByUser = true;
  }

  function unblockUser(): void {
    artist.BlockedByUser = false;
  }

  return {
    artist: readonly(artist),
    artworks: readonly(artworks),
    followers,
    followed,
    loadArtistData,
    updateName,
    resetArtworks,
    loadArtworks,
    addArtwork,
    removeArtwork,
    addUserAsFollower,
    removeUserAsFollower,
    blockUser,
    unblockUser
  };
});
