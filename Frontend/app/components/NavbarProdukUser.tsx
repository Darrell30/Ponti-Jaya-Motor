'use client';

import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react'; // Tambahkan icon cart

export default function NavbarProdukUser() {
  return (
    <div className="sticky-product-header">
      <Container>
        <Row className="align-items-center g-custom-20">
          
          <Col md={3}>
            <Link href="/" passHref legacyBehavior>
              <h5 className="fw-bold text-dark mb-0 navbar-brand-link">
                PONTI JAYA MOTOR
              </h5>
            </Link>
          </Col>

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

          {/* PERBAIKAN DI SINI: Bungkus Button di dalam Link */}
          <Col md={4} className="d-flex justify-content-end gap-2">
            <Link href="/keranjang" passHref legacyBehavior>
              <Button 
                variant="primary" 
                className="fw-bold" 
                style={{ padding: '0.6rem 1.2rem' }}
              >
                <ShoppingCart size={20} className="me-2" />
                Keranjang
              </Button>
            </Link>
          </Col>
          
        </Row>
      </Container>
    </div>
  );
}