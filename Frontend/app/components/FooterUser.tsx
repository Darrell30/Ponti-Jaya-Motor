// app/components/FooterUser.tsx
'use client';

import { Container, Row, Col, Nav } from 'react-bootstrap';
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
              {/* 1. Tokopedia (<img>) */}
              <a 
                href="#" 
                className="btn-icon-circle bg-primary me-2" 
                title="Tokopedia"
              >
                <img 
                  src="/images/icons/tokopedia.svg" 
                  alt="Tokopedia" 
                />
              </a>
              
              {/* 2. Shopee (<img>) */}
              <a 
                href="#" 
                className="btn-icon-circle bg-primary me-2" 
                title="Shopee"
              >
                <img 
                  src="/images/icons/shopee.svg" 
                  alt="Shopee" 
                />
              </a>
              
              {/* 3. Instagram (DIUBAH ke <img>) */}
              <a 
                href="#" 
                className="btn-icon-circle bg-primary me-2" 
                title="Instagram"
              >
                <img 
                  src="/images/icons/instagram.svg" 
                  alt="Instagram" 
                />
              </a>
              
              {/* 4. WhatsApp (DIUBAH ke <img>) */}
              <a 
                href="https://wa.me/6281297575567" 
                className="btn-icon-circle bg-primary me-2" 
                title="WhatsApp"
              >
                <img 
                  src="/images/icons/whatsapp.svg" 
                  alt="WhatsApp" 
                />
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
              
              <Link href="/logout" className="nav-link text-danger fw-bold ps-3">
                Keluar
              </Link>
            </Nav>
          </Col>

        </Row>
      </Container>
    </footer>
  );
}

export default FooterUser;