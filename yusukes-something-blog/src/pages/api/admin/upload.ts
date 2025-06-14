// src/pages/api/admin/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabaseClient'; // ★ Supabaseクライアントをインポート

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const form = formidable({});

  try {
    const [fields, files] = await form.parse(req);
    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // --- ▼▼▼ ここからSupabaseへのアップロード処理 ▼▼▼ ---
    
    // 1. アップロードされた一時ファイルを読み込む
    const fileContent = await fs.readFile(uploadedFile.filepath);

    // 2. Supabase Storageにアップロードするためのファイル名とパスを定義
    // (例: 'public/timestamp-originalfilename.png')
    // Supabaseのバケット内では、フォルダ構造を自由に作れます
    const fileName = `${Date.now()}-${uploadedFile.originalFilename?.replace(/\s+/g, '_') || 'untitled'}`;
    const filePath = `public/${fileName}`; // バケット内のパス

    // 3. Supabase Storageにファイルをアップロード
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('article-images') // ★ 作成したバケット名
      .upload(filePath, fileContent, {
        cacheControl: '3600',
        upsert: false,
        contentType: uploadedFile.mimetype || 'application/octet-stream',
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      throw uploadError;
    }

    // 4. アップロードされたファイルの公開URLを取得
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('article-images') // ★ 作成したバケット名
      .getPublicUrl(filePath);

    if (!publicUrlData) {
      throw new Error('Could not get public URL for uploaded file.');
    }
    
    // --- ▲▲▲ ここまでSupabaseへのアップロード処理 ▲▲▲ ---

    // 一時ファイルを削除 (任意)
    await fs.unlink(uploadedFile.filepath);

    console.log(`File uploaded successfully to Supabase: ${publicUrlData.publicUrl}`);
    return res.status(200).json({
      message: 'File uploaded successfully!',
      url: publicUrlData.publicUrl, // ★ Supabaseから取得した公開URLを返す
      filename: fileName
    });

  } catch (error: any) {
    console.error('Error processing file upload:', error);
    return res.status(500).json({ error: 'Error processing file upload: ' + error.message });
  }
}