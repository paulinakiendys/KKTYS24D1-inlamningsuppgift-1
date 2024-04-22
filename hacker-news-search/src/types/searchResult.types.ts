type Hit = {
  author: string;
  created_at_i: number;
  points: number;
  title: string;
  url: string;
  [key: string]: any;
};

type Response<T> = {
  hits: T;
  page: number;
  nbPages: number;
  query: string;
  [key: string]: any;
};

export type SearchResult = Response<Hit[]>;
