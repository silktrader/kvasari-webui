<template>

  <section class='reactions-container'>

    <q-btn-dropdown
      class='reaction-button'
      color='primary'
      split
    >
      <template v-slot:label>
        <div class='reaction-label'>
          <q-icon v-if='!selectedReaction' left name='add_reaction' size='xl' />
          <q-avatar v-else class='reaction-label-button'>
            <img :src='`${baseUrl}/static/${reactionIcons.get(selectedReaction)}.png`' />
          </q-avatar>
        </div>
      </template>

      <q-list>

        <q-item v-close-popup clickable @click='removeReaction'>
          <q-item-section avatar>
            <img :src='`${baseUrl}/static/no_face.png`' alt='No Reaction' class='reaction-icon' />
          </q-item-section>
          <q-item-section>
            <q-item-label>None</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-close-popup clickable @click='addReaction(ReactionType.Like)'>
          <q-item-section avatar>
            <img :src='`${baseUrl}/static/thumb_up.png`' alt='Like' class='reaction-icon' />
          </q-item-section>
          <q-item-section>
            <q-item-label>Like</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-close-popup clickable @click='addReaction(ReactionType.Perplexed)'>
          <q-item-section avatar>
            <img :src='`${baseUrl}/static/monocle.png`' alt='Perplexed' class='reaction-icon' />
          </q-item-section>
          <q-item-section>
            <q-item-label>Perplexed</q-item-label>
          </q-item-section>
        </q-item>

      </q-list>
    </q-btn-dropdown>

    <section class='reactions-breakdown'>

      <div v-for='[reactionType, reactions] in categorisedReactions' :key='reactionType' class='reaction-type'>
        <img :src='`${baseUrl}/static/${reactionIcons.get(reactionType)}.png`' class='reaction-icon' />
        <q-badge class='reaction-badge' color='secondary'>{{ reactions.length }}</q-badge>
      </div>

    </section>

  </section>

</template>

<script lang='ts' setup>

import { computed, ref } from 'vue';
import { api, baseUrl } from 'boot/axios';
import { User, useUserStore } from 'stores/user-store';
import { useQuasar } from 'quasar';

enum ReactionType {
  Like = 'Like',
  Perplexed = 'Perplexed'
}

interface Reaction {
  AuthorAlias: string;
  AuthorName: string;
  Reaction: ReactionType;
  Date: Date;
}

const reactionIcons = new Map([
  [ReactionType.Like, 'thumb_up'],
  [ReactionType.Perplexed, 'monocle']
]);

const props = defineProps<{ artworkId: string }>();
const q = useQuasar();
const user = <User>useUserStore().user;

const selectedReaction = ref<ReactionType>();
const reactions = ref<ReadonlyArray<Reaction>>([]);

const getReactions = async () => {
  const response = await api.get<Reaction[]>(`/artworks/${props.artworkId}/reactions`);
  reactions.value = response.data;

  // find the user's reaction and display it
  const userReaction = reactions.value.find(reaction => reaction.AuthorAlias == user.Alias);
  if (userReaction) {
    selectedReaction.value = userReaction.Reaction;
  }
};

await getReactions();

// update the user reaction with a new one
async function addReaction(type: ReactionType): Promise<void> {

  try {
    const response = await api.put<{ Status: string, Date: Date }>(`/artworks/${props.artworkId}/reactions/${user.Alias}`, {
      Reaction: type
    });

    // ensure proper removal of existing user reaction
    reactions.value = [...reactions.value.filter(r => r.AuthorAlias !== user.Alias), {
      AuthorAlias: user.Alias,
      AuthorName: user.Name,
      Reaction: type,
      Date: response.data.Date
    }];

    selectedReaction.value = type;

    q.notify({ type: 'positive', message: 'Reaction updated' });

  } catch (e) {
    q.notify({ type: 'negative', message: 'Couldn\'t record your reaction' });
    console.log(e);
  }
}

async function removeReaction(): Promise<void> {
  try {
    await api.delete(`/artworks/${props.artworkId}/reactions/${user.Alias}`);
    reactions.value = [...reactions.value.filter(r => r.AuthorAlias !== user.Alias)];
    q.notify({ type: 'positive', message: 'Reaction removed' });
    selectedReaction.value = undefined;
  } catch (e) {
    q.notify({ type: 'negative', message: 'Couldn\'t record your reaction' });
    console.error(e);
  }
}

// automatically sort reactions in maps for easier display
const categorisedReactions = computed(() => {
  const reactionsMap = new Map<ReactionType, Array<Reaction>>();
  reactions.value.forEach(r => {
    const existingReactions = reactionsMap.get(r.Reaction);
    if (existingReactions) {
      existingReactions.push(r);
    } else {
      reactionsMap.set(r.Reaction, [r]);
    }
  });
  return reactionsMap;
});

</script>

<style lang='scss' scoped>

@import url('https://cdn.jsdelivr.net/gh/SebastianAigner/twemoji-amazing@1.1.0/twemoji-amazing.css');

.reactions-container {
  display: flex;
  flex-direction: column;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.reactions-breakdown {
  display: flex;
  flex-direction: row;
  gap: 16px;
}

.reaction-icon {
  border: 0;
  width: 36px;
}

.reaction-type {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.reaction-button {
  padding-bottom: 1rem;
}

.reaction-label {
  padding: 8px;
}

.reaction-label-button {
  //padding-right: 1rem;
}

.reaction-badge {
  position: relative;
  bottom: 6px;
  left: 6px;
  white-space: nowrap;
  padding: 6px;
  border-radius: 100%;
}

</style>
