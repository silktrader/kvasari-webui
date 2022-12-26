import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'boot/axios';
import { useAuthStore } from 'stores/auth-store';

interface UploadedArtwork {
  Id: string;
  Title?: string;
  Format: string;
  Added: Date;
  Comments: number;
  Reactions: number;
}

interface UserRelation {
  Alias: string;
  Name: string;
  Date: Date;
}

export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore();

  const uploads = ref<UploadedArtwork[]>([]);
  const followers = ref<UserRelation[]>([]);
  const followed = ref<UserRelation[]>([]);

  async function clearUploads() {
    uploads.value = [];
  }

  async function updateProfile() {
      const response = await api.get<{
        Artworks: UploadedArtwork[];
        Followers: UserRelation[];
        FollowedUsers: UserRelation[];
      }>(`/users/${authStore.user?.Alias}/profile`);

      uploads.value.push(...response.data.Artworks);
  }

  return {
    uploads,
    followers,
    followed,
    updateProfile,
    clearUploads,
  };
});
