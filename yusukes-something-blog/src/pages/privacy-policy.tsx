// ─────────────────────────────
// src/pages/privacy-policy.tsx
// ─────────────────────────────
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/StaticPage.module.css';

const PrivacyPolicyPage = () => (
  <>
    <Head>
      <title>プライバシーポリシー | Yusuke&apos;s SomeThing</title>
      <meta
        name="description"
        content="Yusuke's SomeThing のプライバシーポリシーページです。"
      />
      <meta name="robots" content="noindex, nofollow" />
    </Head>

    <div className={styles.staticPageContainer}>
      <h1 className={styles.pageTitle}>プライバシーポリシー</h1>
      <div className={styles.pageContent}>
        {/* 1. 定義 */}
        <h2>1. 個人情報の定義</h2>
        <p>
          本ポリシーにおける個人情報とは、
          個人情報保護法第2条第1項に定義される情報
          （氏名・メールアドレス等、個人を識別できるもの）を指します。
        </p>

        {/* 2. 取得と利用目的 */}
        <h2>2. 個人情報の取得と利用目的</h2>
        <p>
          当サイトは現在、お問い合わせフォームやコメント機能を設置しておりません。
          将来これらの機能を導入する際には、
          取得した個人情報を以下の目的でのみ利用します。
        </p>
        <ul>
          <li>お問い合わせへの回答・必要なご連絡</li>
          <li>不正行為の防止・利用規約違反への対応</li>
        </ul>

        {/* 3. 第三者提供 */}
        <h2>3. 個人情報の第三者提供</h2>
        <p>
          取得した個人情報は、次の場合を除き第三者に提供・開示いたしません。
        </p>
        <ul>
          <li>本人の同意がある場合</li>
          <li>法令に基づき開示が必要な場合</li>
        </ul>

        {/* 4. Cookie */}
        <h2>4. Cookie 等の利用について</h2>
        <p>
          現在、当サイトは Cookie やアクセス解析ツールを使用しておりません。
          導入する場合は、本ポリシーに目的・取得項目・無効化方法を追記します。
        </p>

        {/* 5. 広告・アフィリエイト */}
        <h2>5. 広告・アフィリエイトについて</h2>
        <p>
          現時点でアフィリエイトプログラムや第三者配信広告は利用していません。
          将来導入する場合は、広告配信に伴う Cookie 利用等の情報を追記します。
        </p>

        {/* 6. 開示請求 */}
        <h2>6. 個人情報の開示・訂正・削除請求</h2>
        <p>
          ご本人から自己の個人情報について開示・訂正・削除等の
          請求があった場合は、法令に従い速やかに対応します。
        </p>

        {/* 7. 免責 */}
        <h2>7. 免責事項</h2>
        <p>
          個人情報の漏えい・改ざん・消失・不正アクセス等のリスクに対して
          合理的な安全対策を講じますが、完全性を保証するものではありません。
          詳細は<Link href="/disclaimer">免責事項</Link>をご確認ください。
        </p>

        {/* 8. 改定 */}
        <h2>8. プライバシーポリシーの改定</h2>
        <p>
          本ポリシーは法令やサービス内容の変更に応じて改定する場合があります。
          改定後は速やかに本ページで公表します。
        </p>

        {/* 9. お問い合わせ */}
        <h2>9. お問い合わせ窓口</h2>
        <p>
          個人情報に関するお問い合わせは、以下メールアドレスへご連絡ください。
          <br />
          <strong>yusukekikuta.05@gmail.com</strong>
        </p>

        {/* 最終更新日 */}
        <p
          style={{
            marginTop: '2em',
            fontSize: '0.9em',
            color: 'var(--color-text-muted)',
          }}
        >
          最終更新日：2025年6月2日
        </p>
        <p
          style={{
            marginTop: '2em',
            fontSize: '0.9em',
            color: 'var(--color-text-muted)',
          }}
        >
         菊田佑輔
        </p>
      </div>
    </div>
  </>
);

export default PrivacyPolicyPage;
