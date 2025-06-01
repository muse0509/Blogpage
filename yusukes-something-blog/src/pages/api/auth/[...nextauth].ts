// src/pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // 許可されたメールアドレスかどうかを確認
      if (user.email === process.env.ADMIN_EMAIL) {
        return true; // 許可されたユーザーならサインインを許可
      } else {
        // 許可されていないユーザーはエラーページにリダイレクトするか、falseを返してアクセスを拒否
        console.log(`Unauthorized access attempt by: ${user.email}`);
        return false; // またはリダイレクト '/unauthorized' など
      }
    },
    // 必要に応じて他のコールバック (jwt, sessionなど) を設定できます
    // 例: sessionコールバックでセッションにユーザーIDを追加するなど
    // async session({ session, token, user }) {
    //   if (session.user && token.sub) {
    //     session.user.id = token.sub; // GoogleのユーザーIDをセッションに追加
    //   }
    //   return session;
    // },
  },
  pages: {
    
   
    // signOut: '/auth/signout',
  },
};

export default NextAuth(authOptions);