import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { FamilyProvider } from '@/components/FamilyContext';
import FamilyPicker from '@/components/FamilyPicker';
import GlobalSettings from '@/components/GlobalSettings';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "O'Brien Family Hub",
  description: "The O'Brien family app hub — all our fun stuff in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body style={{ fontFamily: 'var(--dynamic-font, var(--font-outfit), sans-serif)' }}>
        <FamilyProvider>
          <GlobalSettings />
          <FamilyPicker />
          {children}
        </FamilyProvider>
      </body>
    </html>
  );
}
