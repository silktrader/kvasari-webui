import { Author } from 'src/models/author';

// Provides lightweight artwork summaries, to be included in user profiles.
export interface ArtworkPreview {
  Id: string;
  Format: string;
  Updated: string;
  Comments: number;
  Reactions: number;
  Title?: string;
  Added: string;
}

// Provides lightweight artwork summaries, to be included in user profiles.
export interface ArtworkStreamPreview extends ArtworkPreview {
  Author: Author;
}
