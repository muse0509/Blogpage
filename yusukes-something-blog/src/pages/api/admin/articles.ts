// src/pages/api/admin/articles.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import type { Article as ArticleData } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { title, genre, content, published, thumbnailUrl, slug } = req.body;

      if (!title || !genre || !content) {
        return res.status(400).json({ message: 'Title, genre, and content are required.' });
      }

      const newArticleData = {
        title,
        genre,
        content,
        published: typeof published === 'boolean' ? published : false,
        thumbnail_url: thumbnailUrl || null,
        slug: slug || null,
        like_count: 0, // 新規作成時はいいね0
      };

      const { data: newArticle, error } = await supabaseAdmin
        .from('articles')
        .insert(newArticleData)
        .select()
        .single();

      if (error) { throw error; }

      console.log('Article created successfully in Supabase:', newArticle.id);
      return res.status(201).json({ message: 'Article created successfully!', article: newArticle });

    } catch (error: any) {
      console.error('Error creating article in Supabase:', error);
      return res.status(500).json({ message: 'Error creating article: ' + error.message });
    }
  } 
  else if (req.method === 'GET') {
    try {
      const { data: articles, error } = await supabaseAdmin
        .from('articles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) { throw error; }
      
      return res.status(200).json(articles);

    } catch (error: any) {
      console.error('Error fetching articles from Supabase:', error);
      return res.status(500).json({ message: 'Error fetching articles: ' + error.message });
    }
  } 
  else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}