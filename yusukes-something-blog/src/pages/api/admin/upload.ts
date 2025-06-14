// src/pages/api/admin/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabaseClient';

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

  const tempUploadDir = '/tmp'; 
  try {
    await fs.mkdir(tempUploadDir, { recursive: true });
  } catch (error) {
    console.warn('Could not create /tmp dir, it might already exist.');
  }

  const form = formidable({
    uploadDir: tempUploadDir,
    keepExtensions: true,
  });

  try {
    const [fields, files] = await form.parse(req);
    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const fileContent = await fs.readFile(uploadedFile.filepath);

    // ▼▼▼ ここが重要なファイル名のサニタイズ処理 ▼▼▼
    const originalFilename = uploadedFile.originalFilename || 'untitled';
    // 英数字、アンダースコア(_)、ハイフン(-)、ドット(.) 以外を全てアンダースコアに置換
    const safeFilename = originalFilename.replace(/[^a-z0-9_.-]/gi, '_');
    const fileNameInBucket = `${Date.now()}-${safeFilename}`;
    // ▲▲▲ ▲▲▲

    const filePathInBucket = `public/${fileNameInBucket}`; // バケット内に 'public' フォルダを作って整理

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('article-images')
      .upload(filePathInBucket, fileContent, {
        cacheControl: '3600',
        upsert: false,
        contentType: uploadedFile.mimetype || 'application/octet-stream',
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('article-images')
      .getPublicUrl(filePathInBucket);

    if (!publicUrlData) {
      throw new Error('Could not get public URL for uploaded file.');
    }
    
    await fs.unlink(uploadedFile.filepath);

    console.log(`File uploaded successfully to Supabase: ${publicUrlData.publicUrl}`);
    return res.status(200).json({
      message: 'File uploaded successfully!',
      url: publicUrlData.publicUrl,
      filename: fileNameInBucket
    });

  } catch (error: any) {
    console.error('Error processing file upload:', error);
    return res.status(500).json({ error: 'Error processing file upload: ' + error.message });
  }
}