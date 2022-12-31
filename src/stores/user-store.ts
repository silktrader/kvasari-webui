import { defineStore } from 'pinia';
import { reactive, readonly, ref } from 'vue';
import { api } from 'boot/axios';
import { useAuthStore } from 'stores/auth-store';

export interface UploadedArtwork {
  Id: string;
  Title?: string;
  Format: string;
  Added: Date;
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
  const uploads = ref<UploadedArtwork[]>([]);
  const followers = ref<UserRelation[]>([]);
  const followed = ref<UserRelation[]>([]);

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

  async function clearUploads() {
    uploads.value = [];
  }

  async function UpdateProfile() {
    const response = await api.get<{
      Artworks: UploadedArtwork[];
      Followers: UserRelation[];
      FollowedUsers: UserRelation[];
    }>(`/users/${user.Alias}/profile`);

    uploads.value.push(...response.data.Artworks);
  }

  return {
    user: readonly(user),
    uploads: readonly(uploads),
    followers,
    followed,
    setUser,
    UpdateProfile,
    clearUploads,
  };
});
