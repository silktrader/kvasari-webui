// Provides lightweight artwork summaries, to be included in user streams or profiles.
export interface ArtworkPreview {
  Id: string;
  Format: string;
  Updated: string;
  Comments: number;
  Reactions: number;
  Title?: string;
  Added?: string;
  Author?: { Name: string, Alias: string };
}
