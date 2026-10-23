import "./globals.css";

export const metadata = {
  title: "Museum of Tomorrow",
  description: "A digital museum of inventions, ideas and artifacts from the future.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@300;400;500&family=Caveat:wght@500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
