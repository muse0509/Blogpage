// lib/dummyData.ts
export interface Article {
    id: string;
    title: string;
    genre: string;
    date: string;
    excerpt: string;
    slug: string; // 記事詳細ページへのURL用
    imageUrl?: string; // オプショナルな画像URL
  }
  
  export interface Genre {
    id: string;
    name: string;
    slug: string;
  }
  
  export const dummyArticles: Article[] = [
    {
      id: '1',
      title: '初めての読書記録：夏目漱石「こころ」',
      genre: '読書記録',
      date: '2025-05-28',
      excerpt: '人間のエゴイズムと向き合った作品。先生の言葉が心に刺さる...',
      slug: 'kokoro-review',
      imageUrl: 'https://via.placeholder.com/300x200?text=Kokoro',
    },
    {
      id: '2',
      title: 'ブロックチェーン技術の基礎の基礎',
      genre: 'ブロックチェーン',
      date: '2025-05-25',
      excerpt: '分散型台帳技術とは何か？初心者にわかりやすく解説します。',
      slug: 'blockchain-basics',
      imageUrl: 'https://via.placeholder.com/300x200?text=Blockchain',
    },
    {
      id: '3',
      title: '最近読んだSF小説3選',
      genre: '読書記録',
      date: '2025-05-20',
      excerpt: '宇宙の果てから未来都市まで、想像力を刺激するSFの世界。',
      slug: 'sf-recommendations',
    },
    {
      id: '4',
      title: 'インデックス投資とアクティブ投資の違い',
      genre: '金融',
      date: '2025-05-15',
      excerpt: 'どちらが自分に合っている？それぞれのメリット・デメリットを比較。',
      slug: 'investment-styles',
      imageUrl: 'https://via.placeholder.com/300x200?text=Investment',
    },
  ];
  
  export const dummyGenres: Genre[] = [
    { id: 'all', name: 'すべて', slug: 'all' },
    { id: 'reading', name: '読書記録', slug: 'reading-records' },
    { id: 'blockchain', name: 'ブロックチェーン', slug: 'blockchain' },
    { id: 'finance', name: '金融', slug: 'finance' },
    { id: 'tech', name: 'テクノロジー', slug: 'technology' },
  ];
  
  export const recommendedArticles: Article[] = dummyArticles.slice(0, 2); // ダミー記事からおすすめをいくつか選ぶ