export type ArticleListParams = {
  sortField: string;
  sortDirection: string;
  currentPage: string;
  size: string;
};

export type Article = {
  authorName: string;
  categoryId: number;
  categoryName: string;
  coverImage: string;
  createdAt: string;
  favoriteCount: number;
  id: string;
  isFavorited: boolean;
  publishedAt: string;
  readCount: number;
  status: number;
  statusText: string;
  summary: string;
  tags: string;
  title: string;
  updatedAt: string;
};

export type PageResult<T> = {
  current: number;
  pages: number;
  records: T[];
  size: number;
  total: number;
};
