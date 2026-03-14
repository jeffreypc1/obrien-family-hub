import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { FamilyProvider } from '@/components/FamilyContext';
import FamilyPicker from '@/components/FamilyPicker';

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
      <body className="font-outfit">
        <FamilyProvider>
          <FamilyPicker />
          {children}
        </FamilyProvider>
      </body>
    </html>
  );
}
