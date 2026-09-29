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
  /** Only meaningful when `image` is set; undefined/"image" both render as a photo. */
  mediaType?: "image" | "video";
  topic?: string;
  /** Present when the post is a poll; drives the poll card. */
  pollId?: string;
  likes: number;
  comments: number;
  saved: boolean;
  liked: boolean;
}
