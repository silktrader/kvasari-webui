import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { ref, watch } from 'vue';

export interface User {
  readonly Id: string;
  readonly Alias: string;
  readonly Name: string;
}

interface RegisterUserResponse extends User {
  readonly Email: string;
  readonly Created: Date;
  readonly Updated: Date;
}

const userKey: Readonly<string> = 'user';

export const useUserStore = defineStore('user', () => {
  // attempt to set the user on creation, from local storage, fall back to type-safe empty object
  const user = ref<User>(JSON.parse(localStorage.getItem(userKey) ?? 'null') ?? ({} as User));

  // set or clear the storage depending on the user's value
  watch(user, async newUser => {
    localStorage.clear();
    if (newUser) localStorage.setItem(userKey, JSON.stringify(newUser));
  });

  async function Register(regData: { Alias: string; Password: string; Email: string; Name: string }) {
    try {
      const response = await api.post<RegisterUserResponse>('/users', regData);

      // proceed to automatically sign in the user on success, additional properties won't hurt
      user.value = { ...response.data };
    } catch (e) {
      // rethrow the error so components can handle it
      // additional logic is expected here
      throw e;
    }
  }

  async function SignIn(alias: string, password: string) {
    try {
      localStorage.clear();
      const response = await api.post<User & { Status?: string }>('/sessions', {
        alias: alias,
        password: password
      });

      // remove unnecessary data, debatable mutation
      delete response.data.Status;
      user.value = { ...response.data };
    } catch (e) {
      localStorage.clear();

      // rethrow the error so components can handle it
      throw e;
    }
  }

  function SignOut() {
    user.value = {} as User;
  }

  async function updateName(name: string): Promise<void> {
    await api.put(`/users/${user.value.Alias}/name`, {
      name
    });

    // updating the Name will trigger a local storage update by way of a watcher
    user.value = { ...user.value, Name: name };
  }


  async function followArtist(target: string): Promise<void> {
    await api.post<{ Alias: string; Followed: Date; }>(`/users/${user.value.Alias}/followed`, {
      TargetAlias: target
    });
  }

  async function unfollowArtist(target: string): Promise<void> {
    await api.delete(`/users/${user.value.Alias}/followed/${target}`);
  }

  async function blockUser(data: { TargetAlias: string }): Promise<void> {
    await api.post(`/users/${user.value.Alias}/bans`, data);
  }

  async function unblockUser(target: string): Promise<void> {
    await api.delete(`/users/${user.value.Alias}/bans/${target}`);
  }

  return {
    user,
    Register,
    SignIn,
    SignOut,
    updateName,
    followArtist,
    unfollowArtist,
    blockUser,
    unblockUser
  };
});
