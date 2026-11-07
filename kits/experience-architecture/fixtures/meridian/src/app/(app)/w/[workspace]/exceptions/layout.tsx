export default function ExceptionsLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
