'use client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  function signIn(e) {
    e.preventDefault();
    document.cookie = 'session=demo; path=/';
    router.push('/overview');
  }
  return (
    <main>
      <h1>Sign in</h1>
      <form onSubmit={signIn}>
        <label>Email <input name="email" defaultValue="demo@example.com" /></label>
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
