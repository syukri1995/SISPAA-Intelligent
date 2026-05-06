import "./globals.css";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "SISPAA Intelligent Router",
  description: "Intelligent GovTech complaint routing prototype"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

