import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "FreshCart Admin",
  description: "Admin operations panel for FreshCart Market"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
