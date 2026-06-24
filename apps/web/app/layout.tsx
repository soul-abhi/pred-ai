import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PredAI — Student Performance Analytics',
  description: 'ML-powered student exam score prediction and analytics platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
