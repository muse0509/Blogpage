// src/pages/api/admin/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Next.js のデフォルトの bodyParser を無効にする
// formidable がリクエストストリームを直接処理するため
export const config = {
  api: {
    bodyParser: false,
  },
};

// アップロードされたファイルを保存するディレクトリ
// public フォルダを基準とするため、process.cwd() と組み合わせる
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'images');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 認証チェック
  const session = await unstable_getServerSession(req, res, authOptions);
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // UPLOAD_DIR が存在するか確認し、なければ作成
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    return res.status(500).json({ error: 'Server error: Could not create upload directory.' });
  }

  const form = formidable({
    uploadDir: UPLOAD_DIR,
    keepExtensions: true, // ファイルの拡張子を保持
    filename: (name, ext, part, form) => {
      // ユニークなファイル名を生成 (例: timestamp-originalfilename.ext)
      // part.originalFilename が null の場合のフォールバックも考慮
      const originalFilename = part.originalFilename || 'untitled';
      return `${Date.now()}-${originalFilename.replace(/\s+/g, '_')}`; // スペースをアンダースコアに置換
    },
  });

  try {
    const [fields, files] = await form.parse(req);

    // formidable v3以降、filesはMap<string, File | File[] | null> のようになる
    // ここでは単一のファイルアップロードを想定 (キーは 'file' と仮定)
    const uploadedFile = files.file?.[0]; // files.file が配列なので最初の要素を取得

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // filepath は formidable が保存した一時パスまたは最終パス
    // filename は formidable が生成した新しいファイル名
    const newFilePath = uploadedFile.filepath; // formidable v3 では filepath にフルパスが入る
    const newFilename = uploadedFile.newFilename; // formidable v3 では newFilename に生成されたファイル名が入る

    // クライアントに返す公開URL
    // /uploads/images/ は public ディレクトリからの相対パス
    const publicUrl = `/uploads/images/${newFilename}`;

    console.log(`File uploaded successfully: ${newFilename} at ${newFilePath}`);
    return res.status(200).json({ message: 'File uploaded successfully!', url: publicUrl, filename: newFilename });

  } catch (error: any) {
    console.error('Error processing file upload:', error);
    if (error.message.includes('maxFileSize exceeded')) {
      return res.status(413).json({ error: 'File size limit exceeded.' });
    }
    return res.status(500).json({ error: 'Error processing file upload.' });
  }
}