// src/types/index.ts
export interface Article {
  id: string;
  title: string;
  genre: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  thumbnailUrl?: string | null; // nullも許容
  slug?: string | null;         // nullも許容
  likeCount?: number;           // ★ いいね数をオプショナルプロパティとして追加
}