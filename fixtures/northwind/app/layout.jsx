import './globals.css';
import TopBar from '@/components/TopBar';

export const metadata = { title: 'Northwind Ops' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TopBar />
        {children}
      </body>
    </html>
  );
}
