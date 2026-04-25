"use client";

import "./globals.css";
import { LoadingProvider } from "@/context/Loading";
import { SessionProvider } from "next-auth/react";
import { PageInfoProvider } from "@/context/PageInfo";
import { Loading } from "@/components/Loading";
import { Poppins } from "next/font/google";
import { LanguageProvider } from "@/context/Language";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>E-Facility Fleet Dashboard</title>
      </head>
      <body className={`${poppins.variable}`}>
        <LoadingProvider>
          <PageInfoProvider>
            <SessionProvider>
              <LanguageProvider>
                {children} <Loading />
              </LanguageProvider>
            </SessionProvider>
          </PageInfoProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
