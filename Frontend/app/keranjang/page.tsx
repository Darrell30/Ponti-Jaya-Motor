// app/keranjang/page.tsx
'use client';

import { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Image, ListGroup } from 'react-bootstrap';
import Link from 'next/link';

// Tipe data item keranjang
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// Data dummy (sesuai screenshot)
// Nanti, Anda akan mengambil data ini dari database
const initialCartItems: CartItem[] = [
  { id: '1', name: 'Kampas rem', price: 50000, image: '/images/produk/kampas rem.jpg', quantity: 1 },
  { id: '2', name: 'Jasa ganti oli + konsultasi', price: 60000, image: '/images/jasa/servis-rutin.jpg', quantity: 1 },
  { id: '3', name: 'Jasa servis rem', price: 50000, image: '/images/jasa/servis-ganti-oli.jpg', quantity: 1 }, // Ganti gambar
  { id: '4', name: 'Klahar roda', price: 10000, image: '/images/produk/klahar roda.jpg', quantity: 2 },
  { id: '5', name: 'Klahar roda', price: 10000, image: '/images/produk/klahar roda.jpg', quantity: 1 },
];

export default function KeranjangPage() {
  const [cartItems, setCartItems] = useState(initialCartItems);
  
  // Nanti Anda bisa tambahkan fungsi
  // const handleQuantityChange = (id, newQuantity) => { ... }
  // const handleRemoveItem = (id) => { ... }

  // Kalkulasi untuk Ringkasan Belanja
  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <Container className="py-5">
      <h1 className="fw-bold text-dark mb-4">Keranjang</h1>
      
      {/* Gunakan grid 20px kustom kita */}
      <Row className="g-custom-20">
        
        {/* === Kolom Kiri: Daftar Item === */}
        <Col lg={8}>
          <Card className="shadow-sm border-0 rounded-3">
            <Card.Header className="bg-white border-0 py-3">
              <Form.Check 
                type="checkbox"
                id="pilih-semua"
                label={<span className="fw-bold text-dark">Pilih Semua</span>}
              />
            </Card.Header>
            <ListGroup variant="flush">
              {cartItems.map((item) => (
                <ListGroup.Item key={item.id} className="py-3 px-4">
                  <Row className="align-items-center">
                    
                    {/* Checkbox & Gambar */}
                    <Col xs="auto">
                      <Form.Check type="checkbox" id={`item-${item.id}`} />
                    </Col>
                    <Col xs="auto" className="pe-0">
                      <Image src={item.image} alt={item.name} rounded style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                    </Col>
                    
                    {/* Nama Produk & Harga */}
                    <Col>
                      <h6 className="mb-1 fw-bold text-dark">{item.name}</h6>
                      <p className="fw-bold text-dark mb-0">
                        {item.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                      </p>
                    </Col>
                    
                    {/* Aksi: Hapus & Kuantitas */}
                    <Col xs="auto" className="d-flex align-items-center justify-content-end">
                      <Button variant="link" className="text-danger p-0 me-3">
                        <i className="bi bi-trash fs-5"></i>
                      </Button>
                      <div className="d-flex align-items-center">
                        <Button variant="outline-secondary" className="btn-quantity">
                          -
                        </Button>
                        <span className="quantity-display">{item.quantity}</span>
                        <Button variant="outline-secondary" className="btn-quantity">
                          +
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        {/* === Kolom Kanan: Ringkasan Belanja === */}
        <Col lg={4}>
          {/* Card ini dibuat sticky (menempel) saat scroll */}
          <Card className="shadow-sm border-0 rounded-3 sticky-top" style={{ top: '100px' }}>
            <Card.Body className="p-4">
              <h5 className="fw-bold text-dark mb-3">Ringkasan Belanja</h5>
              
              <div className="d-flex justify-content-between mb-3">
                <span className="text-secondary">Total</span>
                <span className="fw-bold fs-5 text-dark">
                  {total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </span>
              </div>

              <hr className="my-3" />

              <h6 className="fw-bold text-dark mb-2">Alamat</h6>
              <p className="text-secondary mb-1 small">Jl. Kamal Raya Outer Ring Road, Cengkareng...</p>
              <Button variant="link" size="sm" className="p-0 text-decoration-none fw-bold">Ubah</Button>

              <Button variant="primary" size="lg" className="w-100 fw-bold mt-4">
                Beli Sekarang
              </Button>
            </Card.Body>
          </Card>
        </Col>

      </Row>
    </Container>
  );
}