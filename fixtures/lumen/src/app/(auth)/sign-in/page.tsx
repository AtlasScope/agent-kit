'use client';

import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    document.cookie = 'lumen_session=demo; path=/; max-age=86400';
    router.push('/projects');
    router.refresh();
  }

  return (
    <div className="center">
      <form className="dialog" onSubmit={submit}>
        <h1>Sign in to Lumen</h1>
        <input type="email" placeholder="you@company.com" defaultValue="maya@acme.test" />
        <input type="password" placeholder="Password" defaultValue="demo" />
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
