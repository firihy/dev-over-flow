export interface Tag {
  _id: string;
  name: string;
}

export interface Author {
  _id: string;
  name: string;
  // Users without a profile picture fall back to a default avatar
  image?: string;
}

export interface Question {
  _id: string;
  title: string;
  tags: Tag[];
  author: Author;
  upvotes: number;
  answers: number;
  views: number;
  createdAt: Date;
}
