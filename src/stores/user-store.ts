import { defineStore } from 'pinia';
import { reactive, readonly, ref } from 'vue';
import { api } from 'boot/axios';

export interface UploadedArtwork {
  Id: string;
  Title?: string;
  Format: string;
  Added: string;
  Comments: number;
  Reactions: number;
}

export interface User {
  Alias: string;
  Name: string;
}

interface UserRelation extends User {
  Date: Date;
}

interface UserDetails extends User {
  Email: string;
  Created: Date;
}

export const useUserStore = defineStore('user', () => {
  const user = reactive<UserDetails>({} as UserDetails);

  const followers = ref<UserRelation[]>([]);
  const followed = ref<UserRelation[]>([]);

  // Stores the artworks uploaded by the targeted user, and fetched by the requester, in reverse chronological order.
  const artworks = ref<Map<string, UploadedArtwork>>(new Map());

  // Tracks whence to get the next artworks from.
  const earliestArtworkDate = ref<string>(new Date().toISOString());

  async function setUser(userAlias: string) {
    const response = await api.get<{
      Name: string;
      Email: string;
      Followers: number;
      Following: number;
      Artworks: number;
      Comments: number;
      Reactions: number;
      Created: Date;
      Updated: Date;
    }>(`/users/${userAlias}`);

    // can't assign new object, must use current reference
    Object.assign(user, response.data);
    user.Alias = userAlias;
  }

  function resetArtworks(): void {
    artworks.value.clear();
    earliestArtworkDate.value = new Date().toISOString();
  }

  // Load an artist's artworks, in reverse chronological order, keeping track of deletions and new uploads since the last
  // request.
  // Loading artworks should be performed in parallel to getting user data, to minimise latency.
  async function loadArtworks(userAlias: string) {
    const response = await api.get<{
      Requested: UploadedArtwork[];
      New: UploadedArtwork[];
      Deleted: string[];
    }>('artworks', {
      params: {
        artist: userAlias,
        latest: new Date().toISOString(),
        since: earliestArtworkDate.value,
      },
    });

    // add artworks in reverse chronological order
    // not deleting the ID property inside the object, for pure convenience
    const newArtworks = new Map<string, UploadedArtwork>();
    response.data.New.forEach(newArtwork =>
      newArtworks.set(newArtwork.Id, newArtwork)
    );

    // remove deleted artworks from current collection
    response.data.Deleted.forEach(deletedId =>
      artworks.value.delete(deletedId)
    );

    // add newly request artworks to current collection
    response.data.Requested.forEach(requestedArtwork =>
      artworks.value.set(requestedArtwork.Id, requestedArtwork)
    );

    // merge the new items with the current collection to update the latter
    artworks.value = new Map<string, UploadedArtwork>([
      ...newArtworks,
      ...artworks.value,
    ]);

    // update timestamps to chain future requests
    earliestArtworkDate.value =
      response.data.Requested.at(-1)?.Added ?? earliestArtworkDate.value;
  }

  // async function UpdateProfile() {
  //   const response = await api.get<{
  //     Artworks: UploadedArtwork[];
  //     Followers: UserRelation[];
  //     FollowedUsers: UserRelation[];
  //   }>(`/users/${user.Alias}/profile`);
  //
  //   uploads.value.push(...response.data.Artworks);
  // }

  function updateName(newName: string) {
    user.Name = newName;
  }

  return {
    user: readonly(user),
    artworks: readonly(artworks),
    followers,
    followed,
    setUser,
    updateName,
    resetArtworks,
    loadArtworks,
  };
});
