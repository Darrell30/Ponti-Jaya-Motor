// app/components/FooterUser.tsx
'use client';

import { Container, Row, Col, Nav, Button } from 'react-bootstrap';
import Link from 'next/link';

function FooterUser() {
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <Container className="container-figma">
        <Row className="align-items-center">
          
          {/* Kolom Kiri: Social Media & Copyright */}
          <Col md={6}>
            <h5 className="mb-3">Temui kami juga di:</h5>
            <div className="mb-3">
              <a href="#" className="btn-icon-circle bg-primary me-2">
                <i className="bi bi-shop"></i>
              </a>
              <a href="#" className="btn-icon-circle bg-primary me-2">
                <i className="bi bi-bag-fill"></i>
              </a>
              <a href="#" className="btn-icon-circle bg-success me-2">
                <i className="bi bi-whatsapp"></i>
              </a>
              <a href="#" className="btn-icon-circle bg-success me-2">
                <i className="bi bi-whatsapp"></i>
              </a>
            </div>
            <p className="text-white-50 small">
              Copyright © 2025 Ponti Jaya Motor. All Rights Reserved
            </p>
          </Col>

          {/* Kolom Kanan: Navigasi & Tombol Keluar */}
          <Col md={6} className="text-md-end">
            <Nav as="nav" className="justify-content-md-end align-items-center mb-3">
              <Link href="/" className="nav-link text-white px-2">Home</Link>
              <Link href="/#jasa" className="nav-link text-white px-2">Jasa</Link>
              <Link href="/produk" className="nav-link text-white px-2">Sparepart</Link>
              <Link href="/#hubungi" className="nav-link text-white px-2">Hubungi Kami</Link>
              
              {/* --- INI PERUBAHANNYA --- */}
              <Link href="/logout" className="nav-link text-danger fw-bold ps-3">
                Keluar
              </Link>
              {/* --- AKHIR PERUBAHAN --- */}
            </Nav>
          </Col>

        </Row>
      </Container>
    </footer>
  );
}

export default FooterUser;