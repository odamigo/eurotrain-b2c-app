import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // İlk giriş sırasında account ve profile bilgilerini token'a ekle
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      if (profile) {
        token.name = profile.name;
        token.email = profile.email;
        token.picture = (profile as any).picture;
      }
      return token;
    },
    async session({ session, token }) {
      // Token bilgilerini session'a aktar
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).provider = token.provider;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // İsteğe bağlı: Kullanıcı girişi sırasında ek kontroller
      // Örneğin: Backend'e kullanıcı kaydı
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin', // Özel giriş sayfası (opsiyonel)
    error: '/auth/error',   // Hata sayfası (opsiyonel)
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
