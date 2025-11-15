// app/keranjang/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Image, ListGroup, Modal, Spinner } from 'react-bootstrap';
import Link from 'next/link';
// 1. Import useRouter
import { useRouter } from 'next/navigation';

// ... (interface CartItem SAMA)
interface CartItem {
  _id: string; 
  productId: string; 
  name: string;
  harga: number;
  image: string;
  quantity: number;
  itemType: 'Sparepart' | 'Service';
}

export default function KeranjangPage() {
  // 2. Inisialisasi router
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [address, setAddress] = useState("Jl. Kamal Raya Outer Ring Road, Cengkareng, Jakarta Barat");
  const [tempAddress, setTempAddress] = useState(address);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // ... (useEffect untuk UserID SAMA)
  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo"); 
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      setUserId(userInfo.userId); 
    } else {
      setLoading(false);
      setError("Anda harus login untuk melihat keranjang.");
    }
  }, []);

  // ... (useEffect untuk fetchCart SAMA)
  useEffect(() => {
    if (userId) {
      fetchCart(userId);
    }
  }, [userId]); 

  // ... (fetchCart SAMA)
  const fetchCart = async (currentUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/cart?userId=${currentUserId}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengambil data keranjang');
      }
      setCartItems(data.data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... (handleUpdateQuantity SAMA)
  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!userId || newQuantity < 1) return; 
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
      setCartItems(data.data.items);
    } catch (err: any) {
      setError(err.message);
      if (userId) fetchCart(userId);
    }
  };

  // ... (handleRemoveItem SAMA)
  const handleRemoveItem = async (cartItemId: string) => {
    if (!userId) return;
    setCartItems(currentItems => currentItems.filter(item => item._id !== cartItemId));
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
      setCartItems(data.data.items);
    } catch (err: any) {
      setError(err.message);
      if (userId) fetchCart(userId);
    }
  };

  // ... (Fungsi Modal Hapus SAMA)
  const handleShowDeleteModal = (cartItemId: string) => {
    setItemToDelete(cartItemId);
    setShowDeleteModal(true);
  };
  const handleCloseDeleteModal = () => {
    setItemToDelete(null);
    setShowDeleteModal(false);
  };
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      handleRemoveItem(itemToDelete);
    }
    handleCloseDeleteModal();
  };

  // ... (handleSelectAll SAMA)
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allItemIds = cartItems.map(item => item._id);
      setSelectedItems(new Set(allItemIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  // ... (handleSelectItem SAMA)
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId); 
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // ... (Modal Alamat SAMA)
  const handleOpenAddressModal = () => {
    setTempAddress(address); 
    setShowAddressModal(true);
  };
  const handleSaveAddress = () => {
    setAddress(tempAddress); 
    setShowAddressModal(false);
  };

  // --- 3. FUNGSI BARU: Logika "Beli Sekarang" ---
  const handleBeliSekarang = () => {
    // A. Filter item di keranjang untuk mendapatkan item yg dipilih
    const itemsToCheckout = cartItems.filter(item => 
      selectedItems.has(item._id)
    );

    if (itemsToCheckout.length === 0) {
      // Seharusnya tombolnya disabled, tapi ini untuk jaga-jaga
      alert("Pilih minimal 1 item untuk dibeli.");
      return;
    }

    // B. Simpan ke localStorage
    localStorage.setItem("checkoutItems", JSON.stringify(itemsToCheckout));
    
    // C. Simpan alamat yang dipilih ke localStorage juga
    // Agar halaman pembayaran bisa langsung menggunakannya
    localStorage.setItem("shippingAddress", address);

    // D. Pindah ke halaman pembayaran
    router.push('/pembayaran');
  };

  // ... (Kalkulasi total SAMA)
  const total = cartItems
    .filter(item => selectedItems.has(item._id)) 
    .reduce((acc, item) => acc + (item.harga * item.quantity), 0); 
  const isAllSelected = cartItems.length > 0 && selectedItems.size === cartItems.length;

  return (
    // ... (JSX Latar Belakang, Container, Judul SAMA)
    <div className="w-100 py-5" style={{ backgroundColor: '#E5E9F0', minHeight: '100vh' }}>
      <Container>
        <h1 className="fw-bold text-dark mb-4">Keranjang</h1>
        
        <Row className="g-custom-20">
          
          {/* ... (Kolom Kiri, Card, Header, Loading, Error, Kosong... SEMUA SAMA) ... */}
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
                            onClick={() => handleShowDeleteModal(item._id)}
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
                
                {/* ... (Total, HR, Alamat... SAMA) ... */}
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

                {/* --- 4. MODIFIKASI TOMBOL --- */}
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 fw-bold mt-2"
                  disabled={selectedItems.size === 0} 
                  onClick={handleBeliSekarang} // <-- Panggil fungsi baru
                >
                  Beli Sekarang
                </Button>
              </Card.Body>
            </Card>
          </Col>

        </Row>
      </Container>

      {/* ... (Modal Alamat SAMA) ... */}
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

      {/* ... (Modal Hapus SAMA) ... */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Konfirmasi Hapus</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Apakah anda Yakin Untuk Menghapus Produk?
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={handleCloseDeleteModal}>
            Tidak
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} className="fw-bold">
            Ya
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}