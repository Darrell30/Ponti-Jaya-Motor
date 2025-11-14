// app/keranjang/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Image, ListGroup, Modal, Spinner } from 'react-bootstrap';
import Link from 'next/link';

// Tipe data item keranjang
interface CartItem {
  _id: string; 
  productId: string; 
  name: string; // Di frontend kita akan sebut 'name'
  harga: number; // <-- DIPERBAIKI: dari 'price' menjadi 'harga'
  image: string;
  quantity: number;
  itemType: 'Sparepart' | 'Service';
}

export default function KeranjangPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // --- State untuk "Pilih Semua" ---
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // === STATE UNTUK ALAMAT & MODAL ===
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [address, setAddress] = useState("Jl. Kamal Raya Outer Ring Road, Cengkareng, Jakarta Barat");
  const [tempAddress, setTempAddress] = useState(address);

  // Ambil UserID dari localStorage
  useEffect(() => {
    // Cek info user dari login
    // Pastikan key-nya "userInfo" sesuai dengan file login/page.tsx
    const userInfoString = localStorage.getItem("userInfo"); 
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      setUserId(userInfo.userId); 
    } else {
      setLoading(false);
      setError("Anda harus login untuk melihat keranjang.");
    }
  }, []);

  // Ambil data Keranjang SETELAH userId didapat
  useEffect(() => {
    if (userId) {
      fetchCart(userId);
    }
  }, [userId]); 

  // Fungsi Mengambil data keranjang
  const fetchCart = async (currentUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/cart?userId=${currentUserId}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengambil data keranjang');
      }
      
      // Backend mengirim 'data: cart'
      setCartItems(data.data.items || []); // Memastikan items adalah array

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Update Kuantitas
  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!userId || newQuantity < 1) return; 

    // Optimistic UI update
    setCartItems(currentItems =>
      currentItems.map(item =>
        item._id === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );

    try {
      const response = await fetch('http://localhost:5000/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, cartItemId, quantity: newQuantity })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal update kuantitas');
      }
      // Set state dari server
      setCartItems(data.data.items);
    } catch (err: any) {
      setError(err.message);
      if (userId) fetchCart(userId); // Rollback jika gagal
    }
  };

  // Fungsi Hapus Item
  const handleRemoveItem = async (cartItemId: string) => {
    if (!userId) return;

    // Optimistic UI update
    setCartItems(currentItems => currentItems.filter(item => item._id !== cartItemId));
    // Juga hapus dari item yang dipilih
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      newSelected.delete(cartItemId);
      return newSelected;
    });

    try {
      const response = await fetch('http://localhost:5000/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, cartItemId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus item');
      }
      // Set state dari server
      setCartItems(data.data.items);
    } catch (err: any) {
      setError(err.message);
      if (userId) fetchCart(userId); // Rollback jika gagal
    }
  };

  // Fungsi "Pilih Semua"
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allItemIds = cartItems.map(item => item._id);
      setSelectedItems(new Set(allItemIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  // Fungsi "Pilih Satu Item"
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId); 
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Handlers Modal Alamat
  const handleOpenAddressModal = () => {
    setTempAddress(address); 
    setShowAddressModal(true);
  };
  const handleSaveAddress = () => {
    setAddress(tempAddress); 
    setShowAddressModal(false);
  };

  // Kalkulasi Total (hanya item yang dipilih)
  const total = cartItems
    .filter(item => selectedItems.has(item._id)) 
    .reduce((acc, item) => acc + (item.harga * item.quantity), 0); 

  // Cek apakah semua item sedang dipilih
  const isAllSelected = cartItems.length > 0 && selectedItems.size === cartItems.length;

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
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  disabled={loading || cartItems.length === 0}
                />
              </Card.Header>
              
              {/* --- TAMPILAN LOADING / ERROR / KOSONG --- */}
              {loading && (
                <div className="text-center p-5">
                  <Spinner animation="border" />
                  <p className="mt-2 text-muted">Memuat keranjang Anda...</p>
                </div>
              )}
              {error && (
                <div className="alert alert-danger m-3">{error}</div>
              )}
              {!loading && !error && cartItems.length === 0 && (
                <div className="text-center p-5">
                  <i className="bi bi-cart-x" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                  <h5 className="mt-3 text-muted">Keranjang Anda kosong</h5>
                  <Link href="/produk" passHref legacyBehavior>
                     <Button variant="primary" className="mt-2 fw-bold">Mulai Belanja</Button>
                  </Link>
                </div>
              )}

              {/* --- DAFTAR ITEM KERANJANG (DARI STATE) --- */}
              {!loading && !error && cartItems.length > 0 && (
                <ListGroup variant="flush">
                  {cartItems.map((item) => (
                    <ListGroup.Item key={item._id} className="py-3 px-4">
                      <Row className="align-items-center">
                        
                        <Col xs="auto">
                          <Form.Check 
                            type="checkbox" 
                            id={`item-${item._id}`}
                            checked={selectedItems.has(item._id)}
                            onChange={() => handleSelectItem(item._id)}
                          />
                        </Col>
                        <Col xs="auto" className="pe-0">
                          <Image src={item.image} alt={item.name} rounded style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                        </Col>
                        
                        <Col>
                          <h6 className="mb-1 fw-bold text-dark">{item.name}</h6>
                          <p className="fw-bold text-dark mb-0">
                            {item.harga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                          </p>
                        </Col>
                        
                        <Col xs="auto" className="d-flex align-items-center justify-content-end">
                          <Button 
                            variant="link" 
                            className="text-danger p-0 me-3"
                            onClick={() => handleRemoveItem(item._id)}
                          >
                            <i className="bi bi-trash fs-5"></i>
                          </Button>
                          <div className="d-flex align-items-center">
                            <Button 
                              variant="outline-secondary" 
                              className="btn-quantity"
                              onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="quantity-display">{item.quantity}</span>
                            <Button 
                              variant="outline-secondary" 
                              className="btn-quantity"
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
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

                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="fw-bold text-dark mb-0">Alamat Pengiriman</h6>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 text-decoration-none fw-bold"
                    onClick={handleOpenAddressModal}
                  >
                    Ubah
                  </Button>
                </div>
                
                <p className="text-secondary mb-3 small" style={{ lineHeight: '1.5' }}>
                  {address}
                </p>

                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 fw-bold mt-2"
                  disabled={selectedItems.size === 0} 
                >
                  Beli Sekarang
                </Button>
              </Card.Body>
            </Card>
          </Col>

        </Row>
      </Container>

      {/* === MODAL UBAH ALAMAT === */}
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