'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function InviteModal() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const open = params.get('invite') === '1';

  return (
    <>
      <Link href={`${pathname}?invite=1`} replace scroll={false} className="button">
        Invite someone
      </Link>
      {open && (
        <div className="overlay">
          <form className="dialog" onSubmit={(e) => e.preventDefault()}>
            <h2>Invite a teammate</h2>
            <input type="email" placeholder="name@company.com" />
            <button type="submit">Send invite</button>
            <button type="button" onClick={() => router.push(pathname)}>
              Close
            </button>
          </form>
        </div>
      )}
    </>
  );
}
