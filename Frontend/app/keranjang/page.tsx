// app/keranjang/page.tsx
'use client';

import { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Image, ListGroup, Modal } from 'react-bootstrap';
import Link from 'next/link';

// Tipe data item keranjang
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// DATA DUMMY (Supaya halaman langsung tampil)
const initialCartItems: CartItem[] = [
  { id: '1', name: 'Kampas rem', price: 50000, image: '/images/produk/kampas rem.jpg', quantity: 1 },
  { id: '2', name: 'Jasa ganti oli', price: 60000, image: '/images/jasa/servis-rutin.jpg', quantity: 1 },
  { id: '3', name: 'Klahar roda', price: 10000, image: '/images/produk/klahar roda.jpg', quantity: 2 },
];

export default function KeranjangPage() {
  const [cartItems, setCartItems] = useState(initialCartItems);
  
  // === STATE UNTUK ALAMAT & MODAL ===
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [address, setAddress] = useState("Jl. Kamal Raya Outer Ring Road, Cengkareng, Jakarta Barat");
  const [tempAddress, setTempAddress] = useState(address); // Untuk menampung inputan sementara

  // === HANDLERS ===
  const handleOpenAddressModal = () => {
    setTempAddress(address); // Reset input ke alamat saat ini
    setShowAddressModal(true);
  };

  const handleSaveAddress = () => {
    setAddress(tempAddress); // Simpan alamat baru
    setShowAddressModal(false);
  };

  // Kalkulasi Total
  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    // Background abu-abu
    <div className="w-100 py-5" style={{ backgroundColor: '#E5E9F0', minHeight: '100vh' }}>
      <Container>
        <h1 className="fw-bold text-dark mb-4">Keranjang</h1>
        
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
                      
                      <Col xs="auto">
                        <Form.Check type="checkbox" id={`item-${item.id}`} />
                      </Col>
                      <Col xs="auto" className="pe-0">
                        <Image src={item.image} alt={item.name} rounded style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                      </Col>
                      
                      <Col>
                        <h6 className="mb-1 fw-bold text-dark">{item.name}</h6>
                        <p className="fw-bold text-dark mb-0">
                          {item.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </p>
                      </Col>
                      
                      <Col xs="auto" className="d-flex align-items-center justify-content-end">
                        <Button variant="link" className="text-danger p-0 me-3">
                          <i className="bi bi-trash fs-5"></i>
                        </Button>
                        <div className="d-flex align-items-center">
                          <Button variant="outline-secondary" className="btn-quantity">-</Button>
                          <span className="quantity-display">{item.quantity}</span>
                          <Button variant="outline-secondary" className="btn-quantity">+</Button>
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

                {/* === BAGIAN ALAMAT === */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="fw-bold text-dark mb-0">Alamat Pengiriman</h6>
                  {/* Tombol Ubah memanggil Modal */}
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 text-decoration-none fw-bold"
                    onClick={handleOpenAddressModal}
                  >
                    Ubah
                  </Button>
                </div>
                
                {/* Menampilkan Alamat */}
                <p className="text-secondary mb-3 small" style={{ lineHeight: '1.5' }}>
                  {address}
                </p>

                <Button variant="primary" size="lg" className="w-100 fw-bold mt-2">
                  Beli Sekarang
                </Button>
              </Card.Body>
            </Card>
          </Col>

        </Row>
      </Container>

      {/* ================================== */}
      {/* === MODAL UBAH ALAMAT (BARU) === */}
      {/* ================================== */}
      <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Ubah Alamat Pengiriman</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formAlamat">
              <Form.Label className="fw-bold text-secondary small">Alamat Lengkap</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="Contoh: Jl. Sudirman No. 1, Jakarta Pusat"
                className="shadow-none"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowAddressModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSaveAddress} className="fw-bold">
            Simpan Alamat
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}