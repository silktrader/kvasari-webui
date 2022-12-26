<template>

  <section class='reactions-container'>

    <q-btn-dropdown
      split
      color='primary'
      class='reaction-button'
    >
      <template v-slot:label>
        <div class='row items-center no-wrap'>
          <q-icon v-if='!selectedReaction' left name='add_reaction' />
          <q-avatar v-else class='reaction-button-label'>
            <img src='http://localhost:3000/static/thumb_up.png' />
          </q-avatar>
          <div class='text-center'>
            React
          </div>
        </div>
      </template>

      <q-list>

        <q-item clickable v-close-popup @click='removeReaction'>
          <q-item-section avatar>
            <img class='reaction-icon' src='http://localhost:3000/static/no_face.png' />
          </q-item-section>
          <q-item-section>
            <q-item-label>None</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-close-popup @click='addReaction(ReactionType.Like)'>
          <q-item-section avatar>
            <img class='reaction-icon' src='http://localhost:3000/static/thumb_up.png' />
          </q-item-section>
          <q-item-section>
            <q-item-label>Like</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-close-popup @click='addReaction(ReactionType.Perplexed)'>
          <q-item-section avatar>
            <img class='reaction-icon' src='http://localhost:3000/static/monocle.png' />
          </q-item-section>
          <q-item-section>
            <q-item-label>Perplexed</q-item-label>
          </q-item-section>
        </q-item>

      </q-list>
    </q-btn-dropdown>

    <section class='reactions-breakdown'>

      <div class='reaction-type' v-for='[reactionType, reactions] in categorisedReactions' :key='reactionType'>
        <img class='reaction-icon' :src='`http://localhost:3000/static/${reactionIcons.get(reactionType)}.png`' />
        <q-badge color='secondary' class='reaction-badge'>{{ reactions.length }}</q-badge>
      </div>

    </section>

    <!--    <img class='twa-3x twa-face-with-monocle' />-->


  </section>

</template>

<script setup lang='ts'>

import { computed, ref, watch } from 'vue';
import { api } from 'boot/axios';
import { useAuthStore } from 'stores/auth-store';
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
const authStore = useAuthStore();
const q = useQuasar();

const selectedReaction = ref<ReactionType>();
const reactions = ref<ReadonlyArray<Reaction>>([]);

const getReactions = async () => {
  const response = await api.get<Reaction[]>(`/artworks/${props.artworkId}/reactions`);
  reactions.value = response.data;

  // find the user's reaction and display it
  const userReaction = reactions.value.find(reaction => reaction.AuthorAlias == authStore.user.Alias);
  if (userReaction) {
    selectedReaction.value = userReaction.Reaction;
  }
};

await getReactions();

// update the user reaction with a new one
async function addReaction(type: ReactionType): Promise<void> {

  try {
    const response = await api.put<{ Status: string, Date: Date }>(`/artworks/${props.artworkId}/reactions/${authStore.user.Alias}`, {
      Reaction: type
    });

    // ensure proper removal of existing user reaction
    reactions.value = [...reactions.value.filter(r => r.AuthorAlias !== authStore.user.Alias), {
      AuthorAlias: authStore.user.Alias,
      AuthorName: authStore.user.Name,
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
    await api.delete(`/artworks/${props.artworkId}/reactions/${authStore.user.Alias}`);
    reactions.value = [...reactions.value.filter(r => r.AuthorAlias !== authStore.user.Alias)];
    q.notify({ type: 'positive', message: 'Reaction removed' });
    selectedReaction.value = undefined;
  } catch (e) {
    q.notify({ type: 'negative', message: 'Couldn\'t record your reaction' });
    console.log(e);
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

<style scoped lang='scss'>

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

.reaction-button-label {
  padding-right: 1rem;
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
