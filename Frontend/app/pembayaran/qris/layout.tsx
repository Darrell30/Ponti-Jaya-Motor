// app/pembayaran/qris/layout.tsx

// Layout ini hanya me-render children-nya tanpa Navbar atau Footer
export default function QrisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      {children}
    </main>
  );
}