import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Legal Document Analyzer - Indian Law Compliance',
  description: 'Upload legal documents and get instant analysis for Indian law compliance issues. Pattern-based detection without AI hallucinations.',
  keywords: ['legal document', 'contract analysis', 'indian law', 'compliance', 'legal tech'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}