import type { Metadata } from 'next';
import { Oswald, Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AssistantWidget } from '@/components/ai/AssistantWidget';
import { CookieConsent } from '@/components/legal/CookieConsent';
import { SkipToContent } from '@/components/layout/SkipToContent';

const fontDisplay = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const fontBody = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const fontMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'HEROY - AI-Native Car Rental',
    template: '%s | HEROY',
  },
  description:
    'HEROY is an AI-native car rental platform - browse a live fleet, get instant quotes, and book a vehicle with help from an AI assistant that can talk and listen.',
  keywords: ['car rental', 'vehicle rental', 'HEROY', 'Ethiopia car rental', 'rent a car'],
  authors: [{ name: 'HEROY' }],
  openGraph: {
    title: 'HEROY - AI-Native Car Rental',
    description: 'Browse, quote, and book a vehicle in minutes.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
      <body className="font-body antialiased">
        <Providers>
          <SkipToContent />
          <Navbar />
          <main id="main-content" className="min-h-screen">{children}</main>
          <Footer />
          <AssistantWidget />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}