import './globals.css';
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  title: 'Todo App',
  description: 'A simple todo app built with Next.js and Express',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Analytics />
      <body>{children}</body>
    </html>
  );
}
