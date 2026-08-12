export const metadata = {
  title: "tawf-verify",
  description: "A notary, not a custodian.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
