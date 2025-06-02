// src/pages/admin/index.tsx
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, FormEvent, useRef, ChangeEvent } from 'react';

import MDEditor, { commands, ICommand, ExecuteState, TextAreaTextApi } from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
// import remarkOembed from 'remark-oembed'; // ← 削除

import Head from 'next/head';
import styles from '../../styles/Admin.module.css';

interface Article {
  id: string;
  title: string;
  genre: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  thumbnailUrl?: string;
  slug?: string;
}

const imageUploadCommand: ICommand = {
  name: 'uploadImage',
  keyCommand: 'uploadImage',
  buttonProps: { 'aria-label': '画像をアップロードして挿入', title: '画像をアップロードして挿入' },
  icon: (
    <svg width="12" height="12" viewBox="0 0 20 20">
      <path fill="currentColor" d="M17.5 2.5H2.5C1.39543 2.5 0.5 3.39543 0.5 4.5V15.5C0.5 16.6046 1.39543 17.5 2.5 17.5H17.5C18.6046 17.5 19.5 16.6046 19.5 15.5V4.5C19.5 3.39543 18.6046 2.5 17.5 2.5ZM2.5 4.5L7.0625 9.0625L9.4375 6.6875L14.0625 11.3125L17.5 7.875V15.5H2.5V4.5ZM14.5 6.5C14.5 7.32843 13.8284 8 13 8C12.1716 8 11.5 7.32843 11.5 6.5C11.5 5.67157 12.1716 5 13 5C13.8284 5 14.5 5.67157 14.5 6.5Z" />
    </svg>
  ),
  execute: async (state: ExecuteState, api: TextAreaTextApi) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const uploadResponse = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          alert(`画像アップロードエラー: ${uploadResult.error || '不明なエラー'}`);
          return;
        }
        const imageUrl = uploadResult.url;
        const imageName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
        const markdownToInsert = `![${imageName}](${imageUrl})`;
        api.replaceSelection(markdownToInsert);
      } catch (uploadError: any) {
        alert(`画像アップロード中にエラー: ${uploadError.message}`);
      }
    };
    input.click();
  },
};

const AdminDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [message, setMessage] = useState('');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingGenres, setExistingGenres] = useState<string[]>([]);

  const fetchAdminArticlesAndGenres = async () => {
    setIsLoadingArticles(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/admin/articles');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '記事一覧の取得に失敗しました。' }));
        throw new Error(errorData.message);
      }
      const data: Article[] = await response.json();
      setArticles(data);
      const uniqueGenres = Array.from(new Set(data.map(article => article.genre))).filter(g => g && g.trim() !== '');
      setExistingGenres(uniqueGenres.sort());
    } catch (err: any) {
      setFetchError(err.message);
      console.error("Error fetching admin articles and genres:", err);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAdminArticlesAndGenres();
    } else if (status === 'unauthenticated') {
      signIn();
    }
  }, [status]);

  const resetForm = () => {
    setTitle(''); setGenre(''); setContent(''); setPublished(false);
    setEditingArticleId(null); setMessage(''); setEditorTab('edit');
    setThumbnailFile(null); setThumbnailPreview(null);
  };

  const handleEditStart = (article: Article) => {
    setEditingArticleId(article.id); setTitle(article.title); setGenre(article.genre);
    setContent(article.content); setPublished(article.published);
    setThumbnailPreview(article.thumbnailUrl || null); setThumbnailFile(null);
    setMessage(''); setEditorTab('edit');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEdit = () => { resetForm(); };

  const handleThumbnailFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setThumbnailPreview(reader.result as string); };
      reader.readAsDataURL(file);
    } else {
      if (editingArticleId) {
        const currentArticle = articles.find(a => a.id === editingArticleId);
        setThumbnailPreview(currentArticle?.thumbnailUrl || null);
      } else {
        setThumbnailPreview(null);
      }
      setThumbnailFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage('');
    let uploadedThumbnailUrl: string | undefined = undefined;
    if (editingArticleId && !thumbnailFile && thumbnailPreview) {
        uploadedThumbnailUrl = thumbnailPreview;
    }
    if (thumbnailFile) {
      const formData = new FormData(); formData.append('file', thumbnailFile);
      try {
        const uploadResponse = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          setMessage(`サムネイルアップロードエラー: ${uploadResult.error || '不明なエラー'}`); return;
        }
        uploadedThumbnailUrl = uploadResult.url;
      } catch (uploadError: any) {
        setMessage(`サムネイルアップロード中にエラー: ${uploadError.message}`); return;
      }
    }
    const articleData: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>> & { thumbnailUrl?: string } = {
      title, genre, content, published, thumbnailUrl: uploadedThumbnailUrl,
    };
    let endpoint = '/api/admin/articles'; let method = 'POST';
    if (editingArticleId) {
      method = 'PUT'; endpoint = `/api/admin/articles/${editingArticleId}`;
    }
    try {
      const response = await fetch(endpoint, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(articleData) });
      let result = { message: '', article: null as Article | null };
      if (response.headers.get("content-length") !== "0" && response.ok) {
          try { result = await response.json(); }
          catch (e) { console.warn("Response JSON parse error (but request OK):", e); result.message = method === 'PUT' ? '記事更新成功 (レスポンス解析失敗)' : '記事作成成功 (レスポンス解析失敗)'; }
      } else if (!response.ok) {
          try { const errorJson = await response.json(); result.message = errorJson.message || (method === 'PUT' ? '記事の更新に失敗しました。' : '記事の作成に失敗しました。'); }
          catch (e) { result.message = method === 'PUT' ? '記事更新失敗 (詳細不明)' : '記事作成失敗 (詳細不明)';}
      }
      if (response.ok) {
        setMessage(editingArticleId ? (result.message || `記事「${result.article?.title || title}」更新完了！`) : (result.message || `記事「${result.article?.title || title}」作成完了！`));
        resetForm(); fetchAdminArticlesAndGenres();
      } else {
        setMessage(`${editingArticleId ? '更新' : '作成'}エラー: ${result.message}`);
      }
    } catch (error: any) {
        console.error(`Client-side error ${editingArticleId ? 'updating' : 'creating'} article:`, error);
        setMessage(`${editingArticleId ? '更新' : '作成'}中にエラー: ${error.message}`);
    }
  };

  const handleDelete = async (articleId: string, articleTitle: string) => {
    if (window.confirm(`記事「${articleTitle}」を本当に削除しますか？`)) {
      setMessage('');
      try {
        const response = await fetch(`/api/admin/articles/${articleId}`, { method: 'DELETE' });
        if (response.ok) {
          if (response.status === 204) { setMessage(`記事「${articleTitle}」を削除しました。`); }
          else { const result = await response.json().catch(() => null); setMessage(result?.message || `記事「${articleTitle}」を削除しました。`);}
          fetchAdminArticlesAndGenres();
        } else {
          const errorResult = await response.json().catch(() => ({ message: '不明な削除エラー' }));
          setMessage(`削除エラー: ${errorResult.message}`);
        }
      } catch (error: any) {
        console.error('Client-side error deleting article:', error);
        setMessage(`削除中にエラー: ${error.message}`);
      }
    }
  };

  if (status === 'loading') { return <p className={styles.loading}>セッション情報を読み込み中...</p>; }
  if (!session) { return <p className={styles.loading}>サインインページへリダイレクト中...</p>; }

  return (
    <>
      <Head>
        <title>{editingArticleId ? '記事編集' : '新しい記事を投稿'} | 管理者ダッシュボード</title>
      </Head>
      <div className={styles.dashboardContainer} data-color-mode="dark">
        <h1>管理者ダッシュボード</h1>
        <p>ようこそ、{session.user?.name || session.user?.email} さん！</p>
        <section className={styles.section} ref={formRef as React.RefObject<HTMLElement>}>
          <h2>{editingArticleId ? '記事を編集' : '新しい記事を投稿'}</h2>
          <form onSubmit={handleSubmit} className={styles.articleForm}>
            <div className={styles.formGroup}>
              <label htmlFor="title">タイトル:</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className={styles.formInput} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="genre">ジャンル:</label>
              <input type="text" id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} required className={styles.formInput} list="genre-suggestions" placeholder="既存のジャンルを選択または新規入力" autoComplete="off" />
              <datalist id="genre-suggestions">
                {existingGenres.map((g, index) => ( <option key={index} value={g} /> ))}
              </datalist>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="thumbnail">サムネイル画像 (任意):</label>
              <input type="file" id="thumbnail" accept="image/*" onChange={handleThumbnailFileChange} className={styles.formInput} key={thumbnailFile ? 'file-selected' : 'no-file'} />
              {thumbnailPreview && ( <div className={styles.thumbnailPreviewContainer}><img src={thumbnailPreview} alt="サムネイルプレビュー" /></div> )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="content">内容 (Markdown):</label>
              <div className={styles.editorTabs}>
                <button type="button" className={`${styles.editorTabButton} ${editorTab === 'edit' ? styles.activeTab : ''}`} onClick={() => setEditorTab('edit')}>書く</button>
                <button type="button" className={`${styles.editorTabButton} ${editorTab === 'preview' ? styles.activeTab : ''}`} onClick={() => setEditorTab('preview')}>プレビュー</button>
              </div>
              <div className={styles.mdeContainer}>
                {editorTab === 'edit' && (
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    height={450}
                    textareaProps={{ placeholder: 'マークダウンで内容を入力してください' }}
                    commands={[
                        commands.title, commands.bold, commands.italic, commands.strikethrough, commands.hr, commands.quote,
                        commands.divider,
                        commands.link,
                        imageUploadCommand,
                        commands.code, commands.codeBlock,
                        commands.divider,
                        commands.unorderedListCommand, commands.orderedListCommand, commands.checkedListCommand,
                        commands.divider,
                        commands.fullscreen,
                    ]}
                  />
                )}
                {editorTab === 'preview' && (
                  <div className={styles.markdownPreview}>
                    <MDEditor.Markdown
                      source={content}
                      remarkPlugins={[remarkGfm]} // ★ remark-oembed は削除済み
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="published">公開ステータス:</label>
              <select id="published" value={published.toString()} onChange={(e) => setPublished(e.target.value === 'true')} className={styles.formSelect} >
                <option value="false">下書き</option>
                <option value="true">公開</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                {editingArticleId ? '変更を保存' : '記事を作成'}
              </button>
              {editingArticleId && ( <button type="button" onClick={handleCancelEdit} className={styles.cancelButton}>キャンセル</button> )}
            </div>
          </form>
          {message && <p className={styles.message}>{message}</p>}
        </section>
        <section className={styles.section}>
          <h2>投稿済み記事一覧</h2>
          {isLoadingArticles && <p className={styles.loading}>記事一覧を読み込んでいます...</p>}
          {fetchError && <p className={styles.message} style={{ color: 'red' }}>エラー: {fetchError}</p>}
          {!isLoadingArticles && !fetchError && articles.length === 0 && ( <p>まだ投稿された記事はありません。</p> )}
          {!isLoadingArticles && !fetchError && articles.length > 0 && (
            <table className={styles.articlesTable}>
              <thead>
                <tr>
                  <th>サムネイル</th>
                  <th>タイトル</th>
                  <th>ジャンル</th>
                  <th>最終更新日時</th>
                  <th>公開状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      {article.thumbnailUrl && (
                        <img src={article.thumbnailUrl} alt={article.title} className={styles.tableThumbnail} />
                      )}
                    </td>
                    <td>{article.title}</td>
                    <td>{article.genre}</td>
                    <td>{new Date(article.updatedAt).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ color: article.published ? 'lightgreen' : 'gray' }}>
                      {article.published ? '公開中' : '下書き'}
                    </td>
                    <td>
                      <button className={styles.actionButton} onClick={() => handleEditStart(article)}>編集</button>
                      <button className={styles.actionButtonDelete} onClick={() => handleDelete(article.id, article.title)}>削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
};

export default AdminDashboard;