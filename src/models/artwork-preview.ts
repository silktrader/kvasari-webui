// Provides lightweight artwork summaries, to be included in user streams or profiles.
export interface ArtworkPreview {
  Id: string;
  Title?: string;
  Format: string;
  Added?: string;
  Updated: string;
  Comments: number;
  Reactions: number;
  AuthorName: string;
  AuthorAlias: string;
}
