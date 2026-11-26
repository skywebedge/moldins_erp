import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ServiceWorkerRegister } from '../components/pwa/ServiceWorkerRegister';
import { ApiFetchBridge } from '../components/system/ApiFetchBridge';
import { NavigationProgress } from '../components/layout/NavigationProgress';
import { tokens } from '../config/tokens';

export const metadata: Metadata = {
  title: 'Moldins ERP | Factory & Civil Construction',
  description: 'Production ERP for Precast Concrete Plant & Civil Construction Infrastructure',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Moldins ERP',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: tokens.colors.brand.DEFAULT,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen bg-page text-primary antialiased font-sans">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                <NavigationProgress />
                <ApiFetchBridge />
                <ServiceWorkerRegister />
                {children}
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
