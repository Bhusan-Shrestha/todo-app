import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from '../contexts/ThemeContext';

export const metadata = {
  title: 'TaskFlow',
  description:
    'A beautiful, fast, and secure task manager. Organize your tasks, track your progress, and get things done.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}