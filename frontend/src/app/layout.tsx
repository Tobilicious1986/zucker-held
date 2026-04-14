import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Fredoka, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-ui" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-playful" });

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
    <html
      lang="de"
      className={`${manrope.variable} ${spaceGrotesk.variable} ${fredoka.variable} h-full`}
      data-theme="light"
      data-age-group="adult"
    >
      <body className="h-full bg-zh-bg app-root">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
