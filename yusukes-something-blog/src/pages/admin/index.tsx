// src/pages/admin/index.tsx
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, FormEvent, useRef, ChangeEvent } from 'react';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import Head from 'next/head';
import styles from '../../styles/Admin.module.css';

// 記事の型定義 (APIから返されるデータ構造と一致させる)
interface Article {
  id: string;
  title: string;
  genre: string;
  content: string; // Markdown形式
  createdAt: string;
  updatedAt: string;
  published: boolean; // 公開ステータス
  thumbnailUrl?: string; // サムネイル画像のURL (オプショナル)
}

const AdminDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // フォームの状態管理
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [message, setMessage] = useState('');

  // 編集モード管理
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // 記事一覧の状態管理
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // フォームセクションへの参照
  const formRef = useRef<HTMLFormElement>(null);

  // エディタの表示モード ('edit' または 'preview')
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');

  // サムネイル用のstate
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // 記事一覧を取得する関数
  const fetchAdminArticles = async () => {
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
    } catch (err: any) {
      setFetchError(err.message);
      console.error("Error fetching admin articles:", err);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  // 認証状態の監視と初期データ取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAdminArticles();
    } else if (status === 'unauthenticated') {
      signIn();
    }
  }, [status]);

  // フォームリセット関数
  const resetForm = () => {
    setTitle('');
    setGenre('');
    setContent('');
    setPublished(false);
    setEditingArticleId(null);
    setMessage('');
    setEditorTab('edit');
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  // 編集開始処理
  const handleEditStart = (article: Article) => {
    setEditingArticleId(article.id);
    setTitle(article.title);
    setGenre(article.genre);
    setContent(article.content);
    setPublished(article.published);
    setThumbnailPreview(article.thumbnailUrl || null); // 既存のサムネイルURLをセット
    setThumbnailFile(null); // ファイル選択はリセット
    setMessage('');
    setEditorTab('edit');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 編集キャンセル処理
  const handleCancelEdit = () => {
    resetForm();
  };

  // サムネイルファイル選択時の処理
  const handleThumbnailFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // ファイル選択がキャンセルされた場合、既存のプレビューを維持するか、
      // もし編集モードで元々サムネイルがあったならそれに戻すか、nullにするかを選択
      // ここでは、もし編集中で元々のサムネイルURLがあればそれを維持、なければnull
      if (editingArticleId) {
        const currentArticle = articles.find(a => a.id === editingArticleId);
        setThumbnailPreview(currentArticle?.thumbnailUrl || null);
      } else {
        setThumbnailPreview(null);
      }
      setThumbnailFile(null);
    }
  };

  // フォーム送信処理 (新規作成/更新)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    let uploadedThumbnailUrl: string | undefined = undefined;

    // 編集モードで、かつ新しいファイルが選択されておらず、既存のプレビューURLがある場合、それを維持する
    if (editingArticleId && !thumbnailFile && thumbnailPreview) {
        uploadedThumbnailUrl = thumbnailPreview;
    }


    // 1. サムネイルファイルが選択されていればアップロード
    if (thumbnailFile) {
      const formData = new FormData();
      formData.append('file', thumbnailFile);

      try {
        const uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          setMessage(`サムネイルアップロードエラー: ${uploadResult.error || '不明なエラー'}`);
          return;
        }
        uploadedThumbnailUrl = uploadResult.url;
      } catch (uploadError: any) {
        setMessage(`サムネイルアップロード中にエラー: ${uploadError.message}`);
        return;
      }
    }


    // 2. 記事データを準備 (アップロードされたサムネイルURLを含む)
    const articleData: Partial<Article> = { // ID はAPI側で自動生成または既存のものを使用
      title,
      genre,
      content,
      published,
      thumbnailUrl: uploadedThumbnailUrl,
    };


    let endpoint = '/api/admin/articles';
    let method = 'POST';
    if (editingArticleId) {
      method = 'PUT';
      endpoint = `/api/admin/articles/${editingArticleId}`;
    }

    // 3. 記事作成/更新APIを呼び出し
    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });

      let result = { message: '', article: null as Article | null }; // articleの型を明示
      if (response.headers.get("content-length") !== "0" && response.ok) {
          try {
            result = await response.json();
          } catch (e) {
            console.warn("Failed to parse JSON response for article, but request was OK:", e);
            result.message = method === 'PUT' ? '記事が更新されましたが、レスポンスの解析に失敗しました。' : '記事が作成されましたが、レスポンスの解析に失敗しました。';
          }
      } else if (!response.ok) { // OKでない場合はエラーメッセージを取得しようとする
          try {
            const errorJson = await response.json();
            result.message = errorJson.message || (method === 'PUT' ? '記事の更新に失敗しました。' : '記事の作成に失敗しました。');
          } catch (e) {
            result.message = method === 'PUT' ? '記事の更新に失敗しました。サーバーから詳細なエラーメッセージはありません。' : '記事の作成に失敗しました。サーバーから詳細なエラーメッセージはありません。';
          }
      }


      if (response.ok) {
        setMessage(
          editingArticleId
            ? (result.message || `記事「${result.article?.title || title}」が更新されました！`)
            : (result.message || `記事「${result.article?.title || title}」が作成されました！`)
        );
        resetForm();
        fetchAdminArticles();
      } else {
        setMessage(`${editingArticleId ? '更新' : '作成'}エラー: ${result.message}`);
      }
    } catch (error: any) {
        console.error(`Error ${editingArticleId ? 'updating' : 'creating'} article:`, error);
        setMessage(`${editingArticleId ? '更新' : '作成'}中にクライアントサイドでエラーが発生しました: ${error.message}`);
    }
  };

  // 記事削除処理
  const handleDelete = async (articleId: string, articleTitle: string) => {
    if (window.confirm(`記事「${articleTitle}」を本当に削除しますか？`)) {
      setMessage('');
      try {
        const response = await fetch(`/api/admin/articles/${articleId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          if (response.status === 204) {
             setMessage(`記事「${articleTitle}」を削除しました。`);
          } else {
            const result = await response.json().catch(() => null);
            setMessage(result?.message || `記事「${articleTitle}」を削除しました。`);
          }
          fetchAdminArticles();
        } else {
          const errorResult = await response.json().catch(() => ({ message: '不明な削除エラーが発生しました。' }));
          setMessage(`削除エラー: ${errorResult.message}`);
        }
      } catch (error: any) {
        console.error('Error deleting article:', error);
        setMessage(`削除中にクライアントサイドでエラーが発生しました: ${error.message}`);
      }
    }
  };

  if (status === 'loading') {
    return <p className={styles.loading}>セッション情報を読み込み中...</p>;
  }
  if (!session) {
    return <p className={styles.loading}>サインインページへリダイレクト中...</p>;
  }

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
              <input type="text" id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} required className={styles.formInput} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="thumbnail">サムネイル画像 (任意):</label>
              <input
                type="file"
                id="thumbnail"
                accept="image/*"
                onChange={handleThumbnailFileChange}
                className={styles.formInput}
                key={thumbnailFile ? 'file-selected' : 'no-file'} // ファイル選択をリセットするため
              />
              {thumbnailPreview && (
                <div className={styles.thumbnailPreviewContainer}>
                  <img src={thumbnailPreview} alt="サムネイルプレビュー" />
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content">内容 (Markdown):</label>
              <div className={styles.editorTabs}>
                <button type="button" className={`${styles.editorTabButton} ${editorTab === 'edit' ? styles.activeTab : ''}`} onClick={() => setEditorTab('edit')}> 書く </button>
                <button type="button" className={`${styles.editorTabButton} ${editorTab === 'preview' ? styles.activeTab : ''}`} onClick={() => setEditorTab('preview')}> プレビュー </button>
              </div>
              <div className={styles.mdeContainer}>
                {editorTab === 'edit' && (
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    height={450}
                    textareaProps={{ placeholder: 'マークダウンで内容を入力してください' }}
                  />
                )}
                {editorTab === 'preview' && (
                  <div className={styles.markdownPreview}>
                    <MDEditor.Markdown source={content} remarkPlugins={[remarkGfm]} style={{ whiteSpace: 'pre-wrap' }} />
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
              {editingArticleId && (
                <button type="button" onClick={handleCancelEdit} className={styles.cancelButton}>
                  キャンセル
                </button>
              )}
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