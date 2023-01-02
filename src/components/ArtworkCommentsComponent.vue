<template>

  <section class='comments'>

    <header>Comments</header>

    <q-form @submit='onNewComment'>
      <div class='form-contents'>
        <div class='form-text'>
          <q-input standout autogrow clearable v-model='newComment' type='textarea'
                   label='New Comment'
                   placeholder='Leave a constructive, possibly articulate, comment.'
                   class='comment-input' />
        </div>
        <div class='form-submit'>
          <q-btn round flat type='submit' color='primary' icon='send' />
        </div>
      </div>
    </q-form>

    <ol>
      <li v-for='comment in comments' :key='comment.Id'>
        <header>
          <q-avatar color='primary' text-color='white'>{{ getInitials(comment.AuthorName) }}</q-avatar>
          <div class='comment-author-date'>
            <span class='comment-author'>{{ comment.AuthorName }}</span>
            <span class='comment-date'>{{ formatRelativeDate(comment.Date) }}</span>
          </div>

          <div style='flex-grow: 5'></div>
          <q-btn-dropdown rounded flat dense no-icon-animation dropdown-icon='more_vert' v-if='canEdit(comment)'>
            <q-list>

              <q-item clickable v-close-popup disable>
                <q-item-section side>
                  <q-icon name='edit' />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Edit</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click='onDeleteComment(comment)'>
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

<script setup lang='ts'>

import { ref } from 'vue';
import { api, BadRequestError } from 'boot/axios';
import { useAuthStore, User } from 'stores/auth-store';
import utilities from './../utilities/utilities';
import { useQuasar } from 'quasar';

interface Comment {
  Id: string;
  AuthorAlias: string;
  AuthorName: string;
  Comment: string;
  Date: Date;
}

const props = defineProps<{ artworkId: string }>();
const user = useAuthStore().user as User;
const q = useQuasar();

const comments = ref<Comment[]>([]);
let newComment = ref<string>('');

const getComments = async () => {
  const response = await api.get<Comment[]>(`/artworks/${props.artworkId}/comments`);
  comments.value = response.data;
};

await getComments();

function getInitials(fullName: string): string {
  return fullName.split(' ').map(name => name.charAt(0)).join('');
}

function formatRelativeDate(commentDate: Date): string {
  return utilities.FormatRelativeDate(commentDate);
}

async function onNewComment(): Promise<void> {
  try {
    const response = await api.post<{ Id: string; Date: Date }>(`/artworks/${props.artworkId}/comments`, { Comment: newComment.value });
    comments.value = [...comments.value, {
      Id: response.data.Id,
      AuthorAlias: user.Alias,
      AuthorName: user.Name,
      Comment: newComment.value,
      Date: response.data.Date
    }];
  } catch (e) {
    console.error(e);
  } finally {
    newComment.value = '';
  }
}

function canEdit(comment: Comment): boolean {
  return comment.AuthorAlias === user.Alias;
}

async function onDeleteComment(comment: Comment): Promise<void> {
  try {
    await api.delete(`/artworks/${props.artworkId}/comments/${comment.Id}`);
    comments.value = [...comments.value.filter(c => c.Id !== comment.Id)];
    q.notify({ type: 'positive', message: 'Comment deleted' });
  } catch (e) {
    if (e instanceof BadRequestError) q.notify({
      type: 'negative',
      message: `Couldn\'t delete the comment: </br>${e.Message}`,
      html: true
    });
    else {
      q.notify({
        type: 'negative',
        message: 'Couldn\'t delete the comment.'
      });
    }
    console.error(e);
  }
}

</script>

<style scoped lang='scss'>

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

  header {
    display: flex;
    gap: 10px;
  }

  article {
    font-size: medium;
  }
}

.comment-author-date {
  display: flex;
  flex-direction: column;
}

.comment-author {
  font-size: small;
  font-weight: 600;
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
