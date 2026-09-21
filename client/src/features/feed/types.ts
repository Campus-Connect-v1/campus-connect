export interface FeedAuthor {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  hall: string;
}

export interface FeedPost {
  id: string;
  author: FeedAuthor;
  postedAt: string;
  caption: string;
  image?: string;
  topic?: string;
  /** Present when the post is a poll; drives the poll card. */
  pollId?: string;
  likes: number;
  comments: number;
  saved: boolean;
  liked: boolean;
}
