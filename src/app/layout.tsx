import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Companero - AI Product Planning",
  description: "Build your product plan piece by piece with AI guidance",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full">
        {children}
      </body>
    </html>
  );
}
