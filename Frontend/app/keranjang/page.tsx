// app/keranjang/page.tsx
'use client';

// === MODIFIKASI: Tambahan import ===
import { useState, useEffect, useRef } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, Image, ListGroup, Modal, Spinner,
  InputGroup, Alert // <-- Baru
} from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// === BARU: Import untuk Google Maps ===
import { Home as HomeIcon, MapPin } from 'lucide-react';
import { useJsApiLoader, GoogleMap, Autocomplete } from '@react-google-maps/api';
// ===================================

interface CartItem {
  _id: string; 
  productId: string; 
  name: string;
  harga: number;
  image: string;
  quantity: number;
  itemType: 'Sparepart' | 'Service';
}

// === BARU: Konstanta untuk Google Maps ===
interface MapCenter { lat: number; lng: number; }
const defaultCenter: MapCenter = { lat: -6.2088, lng: 106.8456 }; // Default: Jakarta
const libraries: ("places")[] = ['places'];
// ===================================

export default function KeranjangPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // === MODIFIKASI: State untuk Alamat & Modal ===
  const [address, setAddress] = useState("Memuat alamat..."); // State utama untuk alamat
  const [tempAddress, setTempAddress] = useState(""); // State untuk form di dalam modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  // ===========================================
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // === BARU: State untuk Google Maps & Modal ===
  const [isSaving, setIsSaving] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<MapCenter>(defaultCenter);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  // ===========================================

  // === BARU: Loader Google Maps API ===
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: libraries,
  });
  // ====================================

  // Ambil UserID dan Alamat Profil
  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo"); 
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      setUserId(userInfo.userId); 
      fetchProfile(userInfo.userId); // Panggil fungsi fetch profil
    } else {
      setLoading(false);
      setError("Anda harus login untuk melihat keranjang.");
      router.push('/login');
    }
  }, [router]);

  // Ambil data Keranjang SETELAH userId didapat
  useEffect(() => {
    if (userId) {
      fetchCart(userId);
    }
  }, [userId]); 

  // Fungsi: Mengambil profil (alamat) user
  const fetchProfile = async (currentUserId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile?userId=${currentUserId}`);
      const data = await response.json();
      if (data.success && data.data.alamat) {
        setAddress(data.data.alamat); // Set alamat dari DB
      } else {
        setAddress("Alamat belum diatur"); // Fallback
      }
    } catch (err) {
      console.error("Gagal fetch profil:", err);
      setAddress("Gagal memuat alamat"); // Fallback
    }
  };

  // Fungsi: Mengambil data keranjang
  const fetchCart = async (currentUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart?userId=${currentUserId}`);
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

  // ... (Fungsi handleUpdateQuantity tidak berubah) ...
  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!userId || newQuantity < 1) return; 
    setCartItems(currentItems =>
      currentItems.map(item =>
        item._id === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, cartItemId, quantity: newQuantity })
      });
      const data = await response.json();
      if (!response.ok || !data.success) { throw new Error(data.message || 'Gagal update kuantitas'); }
      setCartItems(data.data.items);
    } catch (err: any) {
      setError(err.message);
      if (userId) fetchCart(userId);
    }
  };

  // ... (Fungsi handleRemoveItem tidak berubah) ...
  const handleRemoveItem = async (cartItemId: string) => {
    if (!userId) return;
    setCartItems(currentItems => currentItems.filter(item => item._id !== cartItemId));
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      newSelected.delete(cartItemId);
      return newSelected;
    });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, cartItemId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) { throw new Error(data.message || 'Gagal menghapus item'); }
      setCartItems(data.data.items);
    } catch (err: any) {
      setError(err.message);
      if (userId) fetchCart(userId);
    }
  };

  // ... (Fungsi-fungsi Modal Hapus tidak berubah) ...
  const handleShowDeleteModal = (cartItemId: string) => {
    setItemToDelete(cartItemId);
    setShowDeleteModal(true);
  };
  const handleCloseDeleteModal = () => {
    setItemToDelete(null);
    setShowDeleteModal(false);
  };
  const handleConfirmDelete = () => {
    if (itemToDelete) { handleRemoveItem(itemToDelete); }
    handleCloseDeleteModal();
  };

  // ... (Fungsi Select tidak berubah) ...
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allItemIds = cartItems.map(item => item._id);
      setSelectedItems(new Set(allItemIds));
    } else {
      setSelectedItems(new Set());
    }
  };
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) { newSelected.delete(itemId); }
    else { newSelected.add(itemId); }
    setSelectedItems(newSelected);
  };

  // === BARU: Fungsi Helper Google Maps ===
  const geocodeAddress = (addressString: string) => {
    if (!isLoaded) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ 'address': addressString }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const newCenter = { lat: location.lat(), lng: location.lng() };
        setMapCenter(newCenter);
        map?.panTo(newCenter);
        map?.setZoom(15);
      } else {
        setMapCenter(defaultCenter);
        map?.panTo(defaultCenter);
      }
    });
  };
  const onMapLoad = (mapInstance: google.maps.Map) => setMap(mapInstance);
  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocompleteInstance;
  };
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (!place || !place.geometry || !place.geometry.location) {
        setModalMessage({ type: 'error', text: 'Harap pilih alamat dari daftar saran yang muncul.' });
        return;
      }
      if(modalMessage?.type === 'error') setModalMessage(null);
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setTempAddress(place.formatted_address || ""); // <-- Update tempAddress
      setMapCenter({ lat, lng });
      map?.panTo({ lat, lng });
      map?.setZoom(15);
    }
  };
  // =======================================

  // === MODIFIKASI: Handlers Modal Alamat ===
  const handleOpenAddressModal = () => {
    setTempAddress(address); // Set form state dari state utama
    setModalMessage(null);
    setIsSaving(false);
    
    // Geocode alamat saat ini ketika modal dibuka
    if (isLoaded) {
      if (address && address !== "Memuat alamat..." && address !== "Alamat belum diatur") {
        geocodeAddress(address);
      } else {
        setMapCenter(defaultCenter);
        map?.panTo(defaultCenter);
      }
    }
    setShowAddressModal(true);
  };

  const handleCloseAddressModal = () => setShowAddressModal(false);

  const handleSaveAddress = async () => {
    if (!userId) {
      setModalMessage({ type: 'error', text: 'User ID tidak ditemukan. Harap login ulang.' });
      return;
    }
    
    setIsSaving(true);
    setModalMessage(null);
    
    try {
      // Panggil API untuk update profil HANYA dengan alamat
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          alamat: tempAddress // Kirim alamat dari form (tempAddress)
        })
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan alamat');
      }
      
      // Jika sukses, update state 'address' utama di halaman keranjang
      setAddress(tempAddress);
      
      // Update juga localStorage
      const userInfoString = localStorage.getItem("userInfo");
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        userInfo.alamat = tempAddress;
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
      }

      setModalMessage({ type: 'success', text: 'Alamat berhasil disimpan!' });
      
      setTimeout(() => {
        handleCloseAddressModal();
      }, 1000);

    } catch (error: any) {
      setModalMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };
  // =========================================

  // Fungsi Beli Sekarang
  const handleBeliSekarang = () => {
    const itemsToCheckout = cartItems.filter(item => 
      selectedItems.has(item._id)
    );
    if (itemsToCheckout.length === 0) {
      alert("Pilih minimal 1 item untuk dibeli.");
      return;
    }
    localStorage.setItem("checkoutItems", JSON.stringify(itemsToCheckout));
    localStorage.setItem("shippingAddress", address); 
    router.push('/pembayaran');
  };

  // Kalkulasi Total
  const total = cartItems
    .filter(item => selectedItems.has(item._id)) 
    .reduce((acc, item) => acc + (item.harga * item.quantity), 0); 
  const isAllSelected = cartItems.length > 0 && selectedItems.size === cartItems.length;

  return (
    <div className="w-100 py-5" style={{ backgroundColor: '#E5E9F0', minHeight: '100vh' }}>
      <Container>
        <h1 className="fw-bold text-dark mb-4">Keranjang</h1>
        <Row className="g-custom-20">
          {/* ... (Kolom Kiri - Daftar Item tidak berubah) ... */}
          <Col lg={8}>
            <Card className="shadow-sm border-0 rounded-3">
              <Card.Header className="bg-white border-0 py-3">
                <Form.Check 
                  type="checkbox" id="pilih-semua"
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
                            type="checkbox" id={`item-${item._id}`}
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
                              variant="outline-secondary" className="btn-quantity"
                              onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            > - </Button>
                            <span className="quantity-display">{item.quantity}</span>
                            <Button 
                              variant="outline-secondary" className="btn-quantity"
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            > + </Button>
                          </div>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card>
          </Col>
          {/* ... (Kolom Kanan - Ringkasan Belanja tidak berubah) ... */}
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
                    variant="link" size="sm" 
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
                  variant="primary" size="lg" 
                  className="w-100 fw-bold mt-2"
                  disabled={selectedItems.size === 0} 
                  onClick={handleBeliSekarang}
                >
                  Beli Sekarang
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* === MODIFIKASI: Modal Ubah Alamat (Versi Google Maps) === */}
      <Modal show={showAddressModal} onHide={handleCloseAddressModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Ubah Alamat Pengiriman</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted d-flex align-items-center gap-2">
                <HomeIcon size={16} /> Alamat Pengiriman
              </Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                placeholder="Masukkan alamat lengkap Anda..." 
                value={tempAddress} 
                onChange={(e) => setTempAddress(e.target.value)} 
                disabled={isSaving}
                className="mb-2"
              />
            </Form.Group>

            {!isLoaded && !loadError && <p className="text-muted small">Memuat peta...</p>}
            {loadError && <Alert variant="danger" className="small py-2">Error memuat Google Maps. Pastikan API Key Anda benar.</Alert>}
            
            {isLoaded && (
              <div className="maps-container">
                <InputGroup className="mb-2 shadow-sm">
                  <InputGroup.Text><MapPin size={16} /></InputGroup.Text>
                  <Autocomplete
                    onLoad={onAutocompleteLoad}
                    onPlaceChanged={onPlaceChanged}
                  >
                    <Form.Control
                      type="text"
                      placeholder="Cari alamat atau nama tempat..."
                      className="shadow-none"
                    />
                  </Autocomplete>
                </InputGroup>

                <GoogleMap
                  mapContainerStyle={{
                    width: '100%',
                    height: '250px',
                    borderRadius: '8px'
                  }}
                  center={mapCenter}
                  zoom={10}
                  onLoad={onMapLoad}
                >
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -100%)',
                    zIndex: 1
                  }}>
                    <MapPin size={32} color="red" />
                  </div>
                </GoogleMap>
              </div>
            )}
          </Form>
          {modalMessage && (
            <Alert 
              variant={modalMessage.type === 'error' ? 'danger' : 'success'} 
              className="small py-2 mt-3"
            >
              {modalMessage.text}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCloseAddressModal} disabled={isSaving}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSaveAddress} disabled={isSaving || !isLoaded} className="fw-bold">
            {isSaving ? <Spinner as="span" size="sm" /> : "Simpan Alamat"}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* ======================================================== */}


      {/* ... (Modal Konfirmasi Hapus tidak berubah) ... */}
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