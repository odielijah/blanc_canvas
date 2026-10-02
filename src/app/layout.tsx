import type { Metadata } from "next";
import { Bricolage_Grotesque, Yellowtail } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  preload: false,
});

const yellowtail = Yellowtail({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yellowtail",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Blanc.",
  description: "Visual Query Builder",
};

const themeInitScript = `
(() => {
  try {
    const theme = localStorage.getItem("qb-theme");
    const allowedThemes = new Set(["brown", "brown-light", "sage"]);
    document.documentElement.dataset.theme = allowedThemes.has(theme)
      ? theme
      : "brown";
  } catch {
    document.documentElement.dataset.theme = "brown";
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bricolageGrotesque.variable} ${yellowtail.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        {children}
      </body>
    </html>
  );
}
