// app/page.tsx
import Navbar from "../app/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const featuredProducts = [
    { name: "Veleg", img: "https://via.placeholder.com/150" },
    { name: "Selang Rem", img: "https://via.placeholder.com/150" },
    { name: "Kampas Rem", img: "https://via.placeholder.com/150" },
    { name: "Seal Lahar Bambu", img: "https://via.placeholder.com/150" },
    { name: "Klahar Roda", img: "https://via.placeholder.com/150" },
    { name: "Tabung Central", img: "https://via.placeholder.com/150" },
    { name: "Komstir Atas", img: "https://via.placeholder.com/150" },
  ];

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      
      {/* Navbar */}
      <Navbar />

      {/* 2. Hero section */}
      <section 
        style={{
          // backround gambar
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/bengkel.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '400px', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <div className="container">
          <h1 className="fw-bold display-4 mb-3">Ponti Jaya Motor</h1>
          <p className="fs-5 mb-4 mx-auto" style={{ maxWidth: '700px' }}>
            Website untuk melihat katalog produk berupa sparepart kendaraan roda tiga, juga menyediakan jasa servis.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Link href="/sparepart" className="btn btn-primary btn-lg px-4 fw-bold rounded-3" style={{backgroundColor: '#0d6efd', border: 'none'}}>
              Lihat Katalog
            </Link>
            <Link href="/jasa" className="btn btn-light btn-lg px-4 fw-bold rounded-3 text-primary">
              Jasa Servis
            </Link>
          </div>
        </div>
      </section>

      {/* Produk terlaris */}
      <section className="py-5 container">
        <h3 className="fw-bold mb-5 text-dark">Produk Yang Paling di Cari-Cari</h3>
        
        {/* Grid Produk*/}
        <div className="row g-4 justify-content-center justify-content-md-start">
          {featuredProducts.map((bengkel, index) => (
            <div key={index} className="col-6 col-sm-4 col-md-3 col-lg-2 text-center">
              <div className="mb-3 d-inline-block rounded-circle overflow-hidden shadow-sm" style={{ width: '120px', height: '120px', position: 'relative' }}>
                <img 
                  src={bengkel.img} 
                  alt={bengkel.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <h6 className="fw-bold text-dark">{bengkel.name}</h6>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}