import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- ESTA LÍNEA ES LA CLAVE. Si falta, no hay estilos.
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard Inventario",
  description: "Dashboard creado con Next.js y Tailwind",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}