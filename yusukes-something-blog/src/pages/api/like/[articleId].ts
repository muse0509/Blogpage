// src/pages/api/like/[articleId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import type { ArticleData } from '../admin/articles'; // ArticleData型をインポート

const articlesFilePath = path.join(process.cwd(), 'data', 'articles.json');
const likesLogFilePath = path.join(process.cwd(), 'data', 'article_likes_log.json'); // ★ いいねログファイル

interface LikeLogEntry {
  articleId: string;
  anonymousUserId: string;
  timestamp: string;
}

interface ApiResponse {
  message?: string;
  error?: string;
  likeCount?: number;
  articleId?: string;
}

// いいねログを読み込むヘルパー関数
async function readLikesLog(): Promise<LikeLogEntry[]> {
  try {
    const fileData = await fs.readFile(likesLogFilePath, 'utf-8');
    if (fileData) {
      return JSON.parse(fileData);
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') { console.error('Error reading likes log file:', error); }
  }
  return [];
}

// いいねログを書き込むヘルパー関数
async function writeLikesLog(data: LikeLogEntry[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(likesLogFilePath), { recursive: true }); // dataフォルダもなければ作成
    await fs.writeFile(likesLogFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing likes log file:', error);
    throw new Error('Failed to write likes log data.');
  }
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { articleId } = req.query;
  // ★ リクエストボディから anonymousUserId を取得
  const { anonymousUserId } = req.body;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!articleId || typeof articleId !== 'string') {
    return res.status(400).json({ error: 'Article ID is required.' });
  }
  // ★ anonymousUserId の存在チェック
  if (!anonymousUserId || typeof anonymousUserId !== 'string') {
    return res.status(400).json({ error: 'Anonymous user ID is required.' });
  }

  try {
    // 1. いいねログを確認して重複チェック
    const likesLog = await readLikesLog();
    const alreadyLiked = likesLog.some(
      log => log.articleId === articleId && log.anonymousUserId === anonymousUserId
    );

    if (alreadyLiked) {
      // 既にいいね済みの場合、現在のいいね数を取得して返す
      let articles: ArticleData[] = [];
      try {
        const fileData = await fs.readFile(articlesFilePath, 'utf-8');
        if (fileData) articles = JSON.parse(fileData);
      } catch (e) { /* articles.json読み込みエラーはここでは致命的ではない */ }
      const currentArticle = articles.find(art => art.id === articleId);
      
      return res.status(200).json({ // HTTPステータスは200 OKで良いが、メッセージで区別
        message: 'Already liked.',
        articleId: articleId,
        likeCount: currentArticle?.likeCount || 0, // 現在のカウントを返す
      });
    }

    // 2. articles.json から記事データを読み込み、いいね数を更新
    let articles: ArticleData[] = [];
    try {
      const fileData = await fs.readFile(articlesFilePath, 'utf-8');
      if (fileData) {
        articles = JSON.parse(fileData);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.error('articles.json not found for liking.');
        return res.status(404).json({ error: 'Article data not found.' });
      }
      throw error;
    }

    const articleIndex = articles.findIndex(art => art.id === articleId);
    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    articles[articleIndex].likeCount = (articles[articleIndex].likeCount || 0) + 1;
    // articles[articleIndex].updatedAt = new Date().toISOString(); // いいねで更新日時を変えるかは任意

    await fs.writeFile(articlesFilePath, JSON.stringify(articles, null, 2));

    // 3. いいねログに新しい記録を追加
    const newLikeEntry: LikeLogEntry = {
      articleId,
      anonymousUserId,
      timestamp: new Date().toISOString(),
    };
    likesLog.push(newLikeEntry);
    await writeLikesLog(likesLog);

    console.log(`Article ${articleId} liked by anonUser ${anonymousUserId}. New count: ${articles[articleIndex].likeCount}`);
    return res.status(200).json({
      message: 'Like registered successfully!',
      articleId: articleId,
      likeCount: articles[articleIndex].likeCount,
    });

  } catch (error) {
    console.error(`Error processing like for article ${articleId} by anonUser ${anonymousUserId}:`, error);
    return res.status(500).json({ error: 'Internal server error while processing like.' });
  }
}