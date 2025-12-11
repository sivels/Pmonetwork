import "../styles/globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";

export const metadata = {
  title: "Employer Applications",
  description: "Manage job applications in real time",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className="min-h-screen text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
