<template>

  <section class='comments'>

    <header>Comments</header>

    <q-form @submit='addComment'>
      <div class='form-contents'>
        <div class='form-text'>
          <q-input v-model='newComment' autogrow class='comment-input' clearable label='New Comment'
                   placeholder='Leave a constructive, possibly articulate, comment.'
                   standout
                   type='textarea' />
        </div>
        <div class='form-submit'>
          <q-btn color='primary' flat icon='send' round type='submit' />
        </div>
      </div>
    </q-form>

    <ol>
      <li v-for='comment in as.comments' :key='comment.Id'>
        <header>
          <q-item class='comment-header' clickable @click='goToProfile(comment)'>
            <q-avatar color='primary' style='cursor: pointer'>{{ getInitials(comment.AuthorName) }}
            </q-avatar>
            <div class='comment-author-date'>
              <span class='comment-author'>{{ comment.AuthorName }}</span>
              <span class='comment-date'>{{ formatRelativeDate(comment.Date) }}</span>
            </div>
          </q-item>

          <div style='flex-grow: 5'></div>
          <q-btn-dropdown v-if='canEdit(comment)' dense dropdown-icon='more_vert' flat no-icon-animation rounded>
            <q-list>

              <q-item v-close-popup clickable disable>
                <q-item-section side>
                  <q-icon name='edit' />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Edit</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-close-popup clickable @click='removeComment(comment)'>
                <q-item-section side>
                  <q-icon name='delete' />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Delete</q-item-label>
                </q-item-section>
              </q-item>

            </q-list>
          </q-btn-dropdown>
        </header>

        <article>
          {{ comment.Comment }}
        </article>
      </li>
    </ol>
  </section>

</template>

<script lang='ts' setup>

import { ref } from 'vue';
import { BadRequestError } from 'boot/axios';
import { useUserStore } from 'stores/user-store';
import utilities from './../utilities/utilities';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useArtworkStore } from 'stores/artwork-store';
import { ArtworkComment } from 'src/models/artwork-comment';

//const props = defineProps<{ artworkId: string }>();
const { user } = storeToRefs(useUserStore());
const as = useArtworkStore();
const q = useQuasar();
const router = useRouter();

let newComment = ref<string>('');

function getInitials(fullName: string): string {
  return fullName.split(' ').map(name => name.charAt(0)).join('');
}

function formatRelativeDate(commentDate: Date): string {
  return utilities.FormatRelativeDate(commentDate);
}

// Determines whether the author of the comment matches the authenticated user.
function canEdit(comment: ArtworkComment): boolean {
  return comment.AuthorAlias === user.value?.Alias;
}

async function addComment(): Promise<void> {
  try {
    await as.addComment(newComment.value);
  } catch (e) {
    if (e instanceof BadRequestError) q.notify({
      type: 'negative',
      message: `An error occurred while adding the comment: </br>${e.Message}`,
      html: true
    });
    else {
      q.notify({
        type: 'negative',
        message: 'A server error occurred while adding the comment.'
      });
    }
    console.error(e);
  } finally {
    newComment.value = '';
  }
}

async function removeComment(comment: ArtworkComment): Promise<void> {
  try {
    await as.removeComment(comment);
    q.notify({ type: 'positive', message: 'Comment deleted.' });
  } catch (e) {
    if (e instanceof BadRequestError) q.notify({
      type: 'negative',
      message: `An error occurred while deleting the comment: </br>${e.Message}.`,
      html: true
    });
    else {
      q.notify({
        type: 'negative',
        message: 'A server error occurred while deleting the comment.'
      });
    }
    console.error(e);
  }
}

function goToProfile(comment: ArtworkComment): void {
  router.push(`/${comment.AuthorAlias}`);
}

</script>

<style lang='scss' scoped>

// about ten words length for each line
$comment-length: 50ch;

.comments {
  display: flex;
  flex-direction: column;
}

ol {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-block: 0;
  padding-inline: 0;
  list-style: none;
}

li {
  display: flex;
  flex-direction: column;
  width: $comment-length;
  gap: 10px;
  padding: 15px;
  background-color: rgb(11, 11, 11);
  border-radius: 5px;

  article {
    font-size: medium;
  }
}

header {
  display: flex;
}

.comment-header {
  padding-left: 0;
  padding-right: 16px;
  display: flex;
  gap: 10px;
}

.comment-author-date {
  display: flex;
  flex-direction: column;
}

.comment-author {
  font-size: small;
  font-weight: 600;
  cursor: pointer;
}

.comment-date {
  font-size: smaller;
  font-style: italic;
}

.comment-input {
  width: $comment-length;
}

.form-contents {
  width: 400px;
  margin-top: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 10px;
}


</style>
