// app/components/NavbarProdukGuest.tsx
'use client';

import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import Link from 'next/link';

export default function NavbarProdukGuest() {
  return (
    <div className="sticky-product-header">
      <Container>
        <Row className="align-items-center g-custom-20">
          
          {/* ================================== */}
          {/* === REVISI DI SINI === */}
          {/* ================================== */}
          <Col md={3}>
            {/* Tambahkan className="navbar-brand-link" ke Link */}
            <Link href="/" passHref legacyBehavior className="navbar-brand-link">
              <h5 className="fw-bold text-dark mb-0">PONTI JAYA MOTOR</h5>
            </Link>
          </Col>
          {/* ================================== */}

          {/* Kolom 2: Search Bar */}
          <Col md={5}>
            <InputGroup className="search-input-group">
              <InputGroup.Text className="border-0 bg-white">
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                className="border-0"
                placeholder="Cari di Ponti Jaya Motor"
                style={{ boxShadow: 'none' }}
              />
            </InputGroup>
          </Col>

          {/* Kolom 3: Tombol */}
          <Col md={4} className="d-flex justify-content-end gap-2">
            <Link href="/login" passHref legacyBehavior>
              <Button variant="outline-primary" className="fw-bold">Masuk</Button>
            </Link>
            <Link href="/register" passHref legacyBehavior>
              <Button variant="primary" className="fw-bold">Daftar</Button>
            </Link>
          </Col>
        </Row>
      </Container>
    </div>
  );
}