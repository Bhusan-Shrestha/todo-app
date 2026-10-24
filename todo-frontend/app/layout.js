import './globals.css';
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from '../contexts/ThemeContext';

export const metadata = {
  title: 'Taskflow — Your Personal Task Manager',
  description: 'A beautiful, fast, and secure todo app. Organize your tasks, track your progress, and get things done.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <Analytics />
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
