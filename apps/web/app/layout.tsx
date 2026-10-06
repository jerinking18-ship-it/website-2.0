import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "FreshCart Market",
  description: "Premium grocery ecommerce platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
