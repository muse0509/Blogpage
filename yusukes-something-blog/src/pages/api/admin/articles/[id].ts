// src/pages/api/admin/articles/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const articlesFilePath = path.join(process.cwd(), 'data', 'articles.json');

// ArticleData 型 (articles.ts と同じものを想定、共通化が望ましい)
interface ArticleData {
  id: string;
  title: string;
  genre: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  thumbnailUrl?: string;
}

async function readArticles(): Promise<ArticleData[]> {
  try {
    const fileData = await fs.readFile(articlesFilePath, 'utf-8');
    if (fileData) { return JSON.parse(fileData); }
  } catch (error: any) {
    if (error.code !== 'ENOENT') { console.error('Error reading articles file:', error); }
  }
  return [];
}

async function writeArticles(data: ArticleData[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(articlesFilePath), { recursive: true });
    await fs.writeFile(articlesFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing articles file:', error);
    throw new Error('Failed to write articles data.');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { query } = req;
  const { id } = query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Article ID is required.' });
  }

  if (req.method === 'DELETE') {
    try {
      const articles = await readArticles();
      const articleIndex = articles.findIndex(article => article.id === id);
      if (articleIndex === -1) {
        return res.status(404).json({ message: 'Article not found.' });
      }
      articles.splice(articleIndex, 1);
      await writeArticles(articles);
      console.log(`Article deleted successfully: ${id}`);
      // 204 No Content を返す場合はボディなし
      return res.status(204).end();
      // メッセージを返す場合は200 OK
      // return res.status(200).json({ message: 'Article deleted successfully!' });
    } catch (error: any) {
      console.error(`Error deleting article ${id}:`, error);
      return res.status(500).json({ message: `Error deleting article: ${error.message}` });
    }
  } else if (req.method === 'PUT') {
    try {
      const { title, genre, content, published, thumbnailUrl } = req.body;
      if (!title || !genre || !content || typeof published !== 'boolean') {
        return res.status(400).json({ message: 'Title, genre, content, and published status are required and must be valid.' });
      }
      const articles = await readArticles();
      const articleIndex = articles.findIndex(article => article.id === id);
      if (articleIndex === -1) {
        return res.status(404).json({ message: 'Article not found for update.' });
      }
      const updatedArticle: ArticleData = {
        ...articles[articleIndex],
        title,
        genre,
        content,
        published,
        updatedAt: new Date().toISOString(),
        thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : articles[articleIndex].thumbnailUrl, // undefinedなら既存の値を維持、明示的にnullが送られてきたらnullで更新される
      };
      articles[articleIndex] = updatedArticle;
      await writeArticles(articles);
      console.log(`Article updated successfully: ${id}`);
      return res.status(200).json({ message: 'Article updated successfully!', article: updatedArticle });
    } catch (error: any) {
      console.error(`Error updating article ${id}:`, error);
      return res.status(500).json({ message: `Error updating article: ${error.message}` });
    }
  } else if (req.method === 'GET') {
    try {
        const articles = await readArticles();
        const article = articles.find(art => art.id === id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found.' });
        }
        return res.status(200).json(article);
    } catch (error: any) {
        console.error(`Error fetching article ${id}:`, error);
        return res.status(500).json({ message: `Error fetching article: ${error.message}` });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}