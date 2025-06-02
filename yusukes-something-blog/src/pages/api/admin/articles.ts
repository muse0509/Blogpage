// src/pages/api/admin/articles.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const articlesFilePath = path.join(process.cwd(), 'data', 'articles.json');

export interface ArticleData {
  id: string;
  title: string;
  genre: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  thumbnailUrl?: string;
  likeCount?: number;
  slug?: string; 

}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  console.log('--- API /api/admin/articles ---');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Method:', req.method);
  console.log('Received session (using unstable_getServerSession):', JSON.stringify(session, null, 2));
  console.log('process.env.ADMIN_EMAIL:', process.env.ADMIN_EMAIL);


  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    console.error(
      'Authorization failed. Session email:', session?.user?.email,
      'Expected ADMIN_EMAIL:', process.env.ADMIN_EMAIL
    );
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await fs.mkdir(path.dirname(articlesFilePath), { recursive: true });
  } catch (error) {
    console.warn('Warning creating data directory (might already exist):', error);
  }

  if (req.method === 'POST') {
    try {
      const { title, genre, content, published, thumbnailUrl } = req.body;
      if (!title || !genre || !content) {
        return res.status(400).json({ message: 'Title, genre, and content are required.' });
      }
      const isPublished = typeof published === 'boolean' ? published : false;
      const newArticle: ArticleData = {
        id: Date.now().toString(),
        title,
        genre,
        content,
        published: isPublished,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnailUrl: thumbnailUrl || undefined,
        likeCount: 0, 
      };
      let articles: ArticleData[] = [];
      try {
        const fileData = await fs.readFile(articlesFilePath, 'utf-8');
        if (fileData) { articles = JSON.parse(fileData); }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log('Articles file not found, initializing new one.');
        } else {
          console.warn('Error reading or parsing articles.json, initializing with empty array:', error.message);
        }
      }
      articles.push(newArticle);
      await fs.writeFile(articlesFilePath, JSON.stringify(articles, null, 2));
      console.log('Article created successfully:', newArticle.id);
      return res.status(201).json({ message: 'Article created successfully!', article: newArticle });
    } catch (error: any) {
      console.error('Error creating article:', error);
      return res.status(500).json({ message: 'Error creating article: ' + error.message });
    }
  } else if (req.method === 'GET') {
    try {
      let articles: ArticleData[] = [];
      try {
        const fileData = await fs.readFile(articlesFilePath, 'utf-8');
        if (fileData) { articles = JSON.parse(fileData); }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log('Articles file not found for GET, returning empty array.');
        } else {
          console.warn('Error reading or parsing articles.json for GET, returning empty array:', error.message);
        }
      }
      articles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); // 更新日時順に変更
      console.log(`Fetched ${articles.length} articles.`);
      return res.status(200).json(articles);
    } catch (error: any) {
      console.error('Error fetching articles:', error);
      return res.status(500).json({ message: 'Error fetching articles: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}