export interface Reaction {
  AuthorAlias: string;
  AuthorName: string;
  Reaction: ReactionType;
  Date: Date;
}

export enum ReactionType {
  Like = 'Like',
  Perplexed = 'Perplexed'
}
