// src/pages/api/admin/articles/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Article ID is required.' });
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) { throw error; }

      console.log(`Article deleted successfully from Supabase: ${id}`);
      return res.status(204).end(); // 成功時は内容なしの 204 No Content を返す
    } catch (error: any) {
      console.error(`Error deleting article ${id} from Supabase:`, error);
      return res.status(500).json({ message: `Error deleting article: ${error.message}` });
    }
  } 
  else if (req.method === 'PUT') {
    try {
      const { title, genre, content, published, thumbnailUrl, slug } = req.body;

      if (!title || !genre || !content || typeof published !== 'boolean') {
        return res.status(400).json({ message: 'Title, genre, content, and published status are required and must be valid.' });
      }

      const updateData = {
        title,
        genre,
        content,
        published,
        thumbnail_url: thumbnailUrl,
        slug,
        updated_at: new Date().toISOString(), // updated_atトリガーがなければ手動で更新
      };

      const { data: updatedArticle, error } = await supabaseAdmin
        .from('articles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) { throw error; }

      console.log(`Article updated successfully in Supabase: ${id}`);
      return res.status(200).json({ message: 'Article updated successfully!', article: updatedArticle });
    } catch (error: any) {
      console.error(`Error updating article ${id} in Supabase:`, error);
      return res.status(500).json({ message: `Error updating article: ${error.message}` });
    }
  } 
  else if (req.method === 'GET') {
    try {
      const { data: article, error } = await supabaseAdmin
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) { throw error; }

      if (!article) {
        return res.status(404).json({ message: 'Article not found.' });
      }
      return res.status(200).json(article);
    } catch (error: any) {
      console.error(`Error fetching article ${id} from Supabase:`, error);
      return res.status(500).json({ message: `Error fetching article: ${error.message}` });
    }
  } 
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}