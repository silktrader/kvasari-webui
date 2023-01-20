import { Author } from 'src/models/author';

export interface ArtworkResponse {
  Author: Author;
  Title: string;
  Type: string;
  Format: string;
  Description: string;
  Year: number;
  Location: string;
  Created: Date;
  Added: Date;
  Updated: Date;
  Comments: number;
  Reactions: number;
}

export interface Artwork extends ArtworkResponse {
  Id: string;
}
