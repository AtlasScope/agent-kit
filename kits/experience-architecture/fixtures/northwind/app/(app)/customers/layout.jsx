import { NoteDraftProvider } from '@/components/NoteDraft';

// Holds the note draft for "the current customer" above the [id] segment.
export default function CustomersLayout({ children }) {
  return <NoteDraftProvider>{children}</NoteDraftProvider>;
}
