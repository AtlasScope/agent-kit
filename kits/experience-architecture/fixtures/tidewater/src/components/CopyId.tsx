import { useState } from 'react';

export function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };
  return (
    <span className="copy-id">
      <code>{id}</code>
      <button type="button" className="link-button" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  );
}
