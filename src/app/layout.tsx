import "./globals.css";

export const metadata = {
  title: "Line Helper",
  description: "Analyze ice hockey line combinations from tracked game data."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
