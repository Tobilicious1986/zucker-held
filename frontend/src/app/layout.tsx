import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

function isLocalHost(host: string | null): boolean {
  if (!host) return false;
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const localHost = isLocalHost(host);
  const title = localHost ? "Zucker-Held Local" : "Zucker-Held";

  return {
    title,
    description: "Diabetes-Management für Kinder und Erwachsene",
    manifest: localHost ? undefined : "/manifest.json",
    appleWebApp: localHost
      ? undefined
      : { capable: true, statusBarStyle: "default", title },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4caf50",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geist.variable} h-full`}>
      <body className="h-full bg-zh-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
