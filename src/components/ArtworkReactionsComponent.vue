<template>

  <section class='reactions-container'>

    <q-btn-dropdown
      class='reaction-button'
      color='primary'
      split
    >
      <template v-slot:label>
        <div class='reaction-label'>
          <q-icon v-if='!userReaction' left name='add_reaction' size='xl' />
          <q-avatar v-else class='reaction-label-button'>
            <img :alt='userReaction' :src='`${baseUrl}/static/${reactionIcons.get(userReaction)}.png`' />
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
        <img :alt='reactionType' :src='`${baseUrl}/static/${reactionIcons.get(reactionType)}.png`'
             class='reaction-icon' />
        <q-badge class='reaction-badge' color='secondary'>{{ reactions.length }}</q-badge>
      </div>

    </section>

  </section>

</template>

<script lang='ts' setup>
import { computed } from 'vue';
import { baseUrl } from 'boot/axios';
import { useUserStore } from 'stores/user-store';
import { useQuasar } from 'quasar';
import { Reaction, ReactionType } from 'src/models/reaction';
import { useArtworkStore } from 'stores/artwork-store';

const reactionIcons = new Map([
  [ReactionType.Like, 'thumb_up'],
  [ReactionType.Perplexed, 'monocle']
]);

const q = useQuasar();
const as = useArtworkStore();
const us = useUserStore();

const userReaction = computed(() => as.reactions.find(r => r.AuthorAlias === us.user.Alias)?.Reaction);

// automatically sort reactions in maps for easier display
const categorisedReactions = computed(() => {
  const reactionsMap = new Map<ReactionType, Array<Reaction>>();
  as.reactions.forEach(r => {
    const existingReactions = reactionsMap.get(r.Reaction);
    if (existingReactions) {
      existingReactions.push(r);
    } else {
      reactionsMap.set(r.Reaction, [r]);
    }
  });
  return reactionsMap;
});

// Updates the authenticated user reaction with a new one.
async function addReaction(type: ReactionType): Promise<void> {
  try {
    await as.addReaction(type);
    // selectedReaction.value = type;
    q.notify({ type: 'positive', message: 'Reaction updated.' });
  } catch (e) {
    q.notify({ type: 'negative', message: 'Error while recording your reaction.' });
    console.error(e);
  }
}

// Removes the authenticated user's reaction.
async function removeReaction(): Promise<void> {
  try {
    await as.removeReaction();
    q.notify({ type: 'positive', message: 'Reaction removed.' });
    // selectedReaction.value = undefined;
  } catch (e) {
    q.notify({ type: 'negative', message: 'Error while deleting your reaction.' });
    console.error(e);
  }
}

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
