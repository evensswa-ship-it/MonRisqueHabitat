import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mon Risque Habitat | Prévention habitat pour les professionnels",
  description:
    "Mon Risque Habitat transforme les données Géorisques en informations claires et actionnables pour les professionnels de l'assurance et de l'habitat.",
  icons: {
    icon: "/brand/logoMRH.png",
    apple: "/brand/logoMRH.png",
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
