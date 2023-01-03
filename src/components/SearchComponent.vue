<template>

  <div class='q-gutter-md row'>
    <q-select
      filled
      v-model='searchText'
      use-input
      hide-selected
      fill-input
      input-debounce='200'
      clearable
      :options='searchResults'
      @filter='filterResults'
      @update:model-value='onResultSelection'
      style='width: 250px; padding-bottom: 32px'
    >
      <template v-slot:prepend>
        <!--              <q-icon v-if="searchText !== ''" name='close' @click.stop.prevent="searchText = ''"-->
        <!--                      class='cursor-pointer' />-->
        <q-icon name='search' @click.stop.prevent />
      </template>

      <template v-slot:no-option>
        <q-item>
          <q-item-section class='text-grey'>
            No results
          </q-item-section>
        </q-item>
      </template>

      <template v-slot:option='scope'>
        <q-list dark separator>
          <q-item clickable v-ripple v-bind='scope.itemProps'>
            <q-item-section avatar>
              <q-avatar size='48px'>
                <img src='https://artincontext.org/wp-content/uploads/2021/03/Famous-Self-Portraits-848x530.jpg'
                     class='user-avatar'>
              </q-avatar>
            </q-item-section>
            <!--                  <q-icon :name='scope.opt.icon' />-->
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
              <q-item-label caption>@{{ scope.opt.label }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </template>

    </q-select>
  </div>

</template>

<script setup lang='ts'>

import { ref } from 'vue';
import { api, baseUrl } from 'boot/axios';
import { useUserStore, User } from 'stores/user-store';
import { useRouter } from 'vue-router';

interface SearchResult {
  readonly name: string;
  readonly label: string;
  readonly value: string;
  readonly icon: string;
}

const router = useRouter();

const searchResults = ref<ReadonlyArray<SearchResult>>([]);
const searchText = ref<string>('');

// assumes user's authentication for the moment
const user: User = <User>useUserStore().user;

function filterResults(val: string, update: any, abort: any): void {
  if (val.length < 3) {
    abort();
    return;
  }

  update(async () => {
    try {
      const sanitisedValue = val.toLowerCase();
      const results = await api.get<ReadonlyArray<User>>(`${baseUrl}/users`, {
        params: {
          filter: sanitisedValue,
          requester: user.Alias
        }
      });
      searchResults.value = results.data.map(user => ({
        label: user.Alias,
        name: user.Name,
        value: user.Alias,
        icon: 'nothing'
      }));
    } catch (e) {
      console.error(e);
    }
  });

  abort(() => {
    console.log('aborted');
  });
}

function onResultSelection(data: { value: string }): void {
  if (data?.value) {
    searchText.value = '';
    router.push(data.value);
  }
}

</script>

<style scoped lang='scss'>

.user-avatar {
  object-fit: cover;
}

</style>
