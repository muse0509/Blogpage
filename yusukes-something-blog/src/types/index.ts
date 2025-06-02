// src/types/index.ts (または src/types/article.ts)
export interface Article {
    id: string;
    title: string;
    genre: string;
    content: string; // Markdown形式
    createdAt: string;
    updatedAt: string;
    published: boolean;
    thumbnailUrl?: string;
    slug?: string; // SEOフレンドリーなURL用 (将来的には必須に)
    excerpt?: string; // 記事の抜粋 (将来的には必須に)
  }