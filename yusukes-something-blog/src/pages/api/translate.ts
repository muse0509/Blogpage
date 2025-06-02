// src/pages/api/translate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Translate } from '@google-cloud/translate/build/src/v2';

interface TranslateRequestBody {
  text: string | string[]; // This can remain as is for the request body
  targetLanguage: string;
}

interface TranslateApiResponse {
  translatedText?: string | string[];
  error?: string;
}

const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranslateApiResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { text, targetLanguage } = req.body as TranslateRequestBody;

  if (!text || !targetLanguage) {
    return res.status(400).json({ error: 'Missing "text" or "targetLanguage" in request body.' });
  }

  try {
    // ▼▼▼ Ensure 'text' is always an array when passed to the API ▼▼▼
    const inputTextArray = Array.isArray(text) ? text : [text];
    const [translations] = await translate.translate(inputTextArray, targetLanguage);
    // ▲▲▲ The translate method now receives a string[] ▲▲▲
    
    // If the original request.body.text was a single string, return a single string.
    // Otherwise, return the array of translations.
    const responseText = Array.isArray(req.body.text) ? translations : translations[0];

    return res.status(200).json({ translatedText: responseText });

  } catch (error: any) {
    console.error('Error during translation API call:', error);
    return res.status(500).json({ error: 'Translation failed: ' + error.message });
  }
}