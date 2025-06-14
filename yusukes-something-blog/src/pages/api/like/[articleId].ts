// src/pages/api/like/[articleId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseClient';

interface ApiResponse {
  message?: string;
  error?: string;
  likeCount?: number;
  articleId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { articleId } = req.query;
  const { anonymousUserId } = req.body;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!articleId || typeof articleId !== 'string') {
    return res.status(400).json({ error: 'Article ID is required.' });
  }
  if (!anonymousUserId || typeof anonymousUserId !== 'string') {
    return res.status(400).json({ error: 'Anonymous user ID is required.' });
  }

  try {
    // 1. いいねログを確認して重複チェック
    const { data: existingLike, error: likeCheckError } = await supabaseAdmin
      .from('article_likes')
      .select('id')
      .eq('article_id', articleId)
      .eq('anonymous_user_id', anonymousUserId)
      .maybeSingle(); // 存在しない場合はnull、複数ならエラー (ユニーク制約があるので単一のはず)

    if (likeCheckError) throw likeCheckError;

    // 現在のいいね数を取得
    const { data: currentArticle, error: articleFetchError } = await supabaseAdmin
      .from('articles')
      .select('like_count')
      .eq('id', articleId)
      .single();
    
    if (articleFetchError) throw articleFetchError;

    if (existingLike) {
      // 既にいいね済みの場合
      return res.status(200).json({
        message: 'Already liked.',
        articleId: articleId,
        likeCount: currentArticle?.like_count || 0,
      });
    }

    // 2. いいね処理 (トランザクションで実行するのが理想だが、ここでは順次実行)
    // まず、いいねログに新しい記録を追加
    const { error: likeLogError } = await supabaseAdmin
      .from('article_likes')
      .insert({
        article_id: articleId,
        anonymous_user_id: anonymousUserId,
      });
    
    if (likeLogError) throw likeLogError;

    // 次に、記事のいいね数をインクリメント
    const newLikeCount = (currentArticle.like_count || 0) + 1;
    const { data: updatedArticle, error: articleUpdateError } = await supabaseAdmin
      .from('articles')
      .update({ like_count: newLikeCount })
      .eq('id', articleId)
      .select('like_count')
      .single();

    if (articleUpdateError) throw articleUpdateError;
    
    console.log(`Article ${articleId} liked by anonUser ${anonymousUserId}. New count: ${updatedArticle.like_count}`);
    return res.status(200).json({
      message: 'Like registered successfully!',
      articleId: articleId,
      likeCount: updatedArticle.like_count,
    });

  } catch (error: any) {
    console.error(`Error processing like for article ${articleId} by anonUser ${anonymousUserId}:`, error);
    return res.status(500).json({ error: 'Internal server error while processing like: ' + error.message });
  }
}