// app/pembayaran/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, Image, Modal, Alert, Spinner,
  InputGroup
} from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home as HomeIcon, MapPin } from 'lucide-react'; 
import { useJsApiLoader, GoogleMap, Autocomplete } from '@react-google-maps/api';

// Deklarasikan 'window.snap' agar TypeScript tidak error
declare global {
  interface Window {
    snap: any;
  }
}

interface CheckoutItem {
  _id: string; 
  productId: string; 
  name?: string; 
  nama?: string; 
  harga: number; 
  image: string;
  quantity: number;
}

interface MapCenter { lat: number; lng: number; }
const defaultCenter: MapCenter = { lat: -6.2088, lng: 106.8456 };
const libraries: ("places")[] = ['places'];

export default function PembayaranPage() {
  const router = useRouter();
  
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false); // Loading untuk tombol Bayar

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [address, setAddress] = useState("Memuat alamat...");
  const [tempAddress, setTempAddress] = useState("");

  const [error, setError] = useState(''); // Untuk menampilkan error

  // State Google Maps (SAMA)
  const [isSaving, setIsSaving] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<MapCenter>(defaultCenter);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: libraries,
  });

  // useEffect untuk ambil data (SAMA)
  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); 
      return;
    }
    const userInfo = JSON.parse(userInfoString);
    const currentUserId = userInfo.userId;
    setUserId(currentUserId);

    const storedAddress = localStorage.getItem("shippingAddress");
    if (storedAddress) {
      setAddress(storedAddress);
      localStorage.removeItem("shippingAddress"); 
    } else {
      fetchProfile(currentUserId);
    }

    const itemsString = localStorage.getItem("checkoutItems");
    if (!itemsString) {
      alert("Tidak ada item untuk di-checkout.");
      router.push('/keranjang');
      return;
    }
    const checkoutItems: CheckoutItem[] = JSON.parse(itemsString);
    if (checkoutItems.length === 0) {
      alert("Tidak ada item untuk di-checkout.");
      router.push('/keranjang');
      return;
    }
    setItems(checkoutItems);
    setLoading(false);

  }, [router]);

  // Fungsi fetchProfile (SAMA)
  const fetchProfile = async (currentUserId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/profile?userId=${currentUserId}`);
      const data = await response.json();
      if (data.success && data.data.alamat) {
        setAddress(data.data.alamat); 
      } else {
        setAddress("Alamat belum diatur");
      }
    } catch (err) {
      console.error("Gagal fetch profil:", err);
      setAddress("Gagal memuat alamat");
    }
  };

  // ... (Semua fungsi Google Maps dan Modal Alamat SAMA) ...
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
      setTempAddress(place.formatted_address || "");
      setMapCenter({ lat, lng });
      map?.panTo({ lat, lng });
      map?.setZoom(15);
    }
  };
  const handleOpenAddressModal = () => {
    setTempAddress(address); 
    setModalMessage(null);
    setIsSaving(false);
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
    setAddress(tempAddress);
    if (userId) {
      try {
        await fetch('http://localhost:5000/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId, alamat: tempAddress })
        });
        const userInfoString = localStorage.getItem("userInfo");
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          userInfo.alamat = tempAddress;
          localStorage.setItem("userInfo", JSON.stringify(userInfo));
        }
      } catch (err) {
        console.error("Gagal simpan alamat ke profil:", err);
      }
    }
    handleCloseAddressModal();
  };
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1; 
    setItems(currentItems =>
      currentItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };
  const handleRemoveItem = (productId: string) => {
    setItems(currentItems =>
      currentItems.filter(item => item.productId !== productId)
    );
  };

  // Kalkulasi Total (SAMA)
  const subtotal = items.reduce((acc, item) => acc + (item.harga * item.quantity), 0);
  const shippingCost = 15000; 
  const grandTotal = subtotal + shippingCost;

  // === FUNGSI UTAMA: TOMBOL BAYAR (VERSI MIDTRANS) ===
  const handleBayar = async () => {
    if (items.length === 0) { setError("Tidak ada item di checkout Anda."); return; }
    if (!userId) { setError("Sesi Anda berakhir. Harap login kembali."); return; }

    setError("");
    setIsPlacingOrder(true);

    // Siapkan data untuk backend
    const orderData = {
      userId: userId,
      items: items.map(item => ({
        productId: item.productId,
        nama: item.nama || item.name, 
        harga: item.harga,
        image: item.image,
        quantity: item.quantity
      })),
      shippingAddress: address,
      totalAmount: grandTotal,
    };

    try {
      // 1. Panggil API Anda untuk membuat pesanan & dapatkan token
      const response = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal membuat pesanan');
      }

      const transactionToken = data.data.token;
      
      // Bersihkan item checkout dari localStorage
      localStorage.removeItem("checkoutItems");

      // 2. Panggil pop-up Midtrans (Snap)
      window.snap.pay(transactionToken, {
        onSuccess: function(result: any){
          /* Pembayaran sukses! */
          console.log('success', result);
          localStorage.setItem("showSuccessNotification", "Pesanan Sudah Berhasil Dibuat");
          router.push('/pembelian');
        },
        onPending: function(result: any){
          /* Pembayaran pending (misal: VA belum dibayar) */
          console.log('pending', result);
          localStorage.setItem("showSuccessNotification", "Pesanan Anda sedang menunggu pembayaran.");
          router.push('/pembelian');
        },
        onError: function(result: any){
          /* Pembayaran gagal */
          console.log('error', result);
          setError("Pembayaran gagal. Silakan coba lagi.");
          setIsPlacingOrder(false);
        },
        onClose: function(){
          /* User menutup pop-up tanpa bayar */
          console.log('customer closed the popup without finishing the payment');
          setError("Anda menutup pop-up pembayaran sebelum selesai.");
          setIsPlacingOrder(false);
        }
      });
      // Kita set false di sini agar tombol bisa diklik lagi jika user menutup pop-up
      // setIsPlacingOrder(false); // Dihandle oleh onClose/onError

    } catch (err: any) {
      setError(err.message); 
      setIsPlacingOrder(false);
    }
  };


  if (loading) {
    return (
      <div className="w-100 py-5 text-center" style={{ backgroundColor: '#E5E9F0', minHeight: '100vh' }}>
        <Spinner animation="border" />
        <p className="mt-2 text-muted">Memuat checkout...</p>
      </div>
    );
  }

  return (
    <div className="w-100 py-5" style={{ backgroundColor: '#E5E9F0', minHeight: '100vh' }}>
      <Container>
        <h1 className="fw-bold text-dark mb-4">Checkout Pembayaran</h1>
        
        <Row className="g-custom-20">
          
          <Col lg={8} className="d-flex flex-column gap-4">
            
            {/* 1. KARTU ALAMAT (SAMA) */}
            <Card className="shadow-sm border-0 rounded-3 card-transaction">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-bold text-dark mb-0">Alamat Pengiriman</h5>
                  <Button 
                    variant="link" size="sm" 
                    className="p-0 text-decoration-none fw-bold"
                    onClick={handleOpenAddressModal}
                  >
                    Ubah
                  </Button>
                </div>
                <p className="text-secondary mb-0 small" style={{ lineHeight: '1.5' }}>
                  {address}
                </p>
              </Card.Body>
            </Card>

            {/* 2. KARTU PRODUK DIPESAN (SAMA) */}
            <Card className="shadow-sm border-0 rounded-3 card-transaction">
              <Card.Body className="p-4">
                <h5 className="fw-bold text-dark mb-3">Produk Dipesan</h5>
                {items.length === 0 && (
                  <Alert variant="warning">
                    Tidak ada item. 
                    <Link href="/keranjang" className="alert-link">Kembali ke keranjang</Link>.
                  </Alert>
                )}
                {items.map((item) => (
                  <Row key={item.productId} className="g-3 mb-3 align-items-center">
                    <Col xs="auto">
                      <Image src={item.image} alt={item.nama || item.name} rounded style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                    </Col>
                    <Col>
                      <h6 className="mb-1 fw-bold text-dark small">{item.nama || item.name}</h6>
                      <p className="text-secondary small mb-0">{item.quantity} x {item.harga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</p>
                    </Col>
                    <Col xs="auto" className="d-flex align-items-center justify-content-end">
                      <Button 
                        variant="link" className="text-danger p-0 me-3"
                        onClick={() => handleRemoveItem(item.productId)}
                        disabled={isPlacingOrder}
                      >
                        <i className="bi bi-trash fs-5"></i>
                      </Button>
                      <div className="d-flex align-items-center">
                        <Button 
                          variant="outline-secondary" className="btn-quantity"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={isPlacingOrder}
                        > - </Button>
                        <span className="quantity-display">{item.quantity}</span>
                        <Button 
                          variant="outline-secondary" className="btn-quantity"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={isPlacingOrder}
                        > + </Button>
                      </div>
                    </Col>
                  </Row>
                ))}
              </Card.Body>
            </Card>

            {/* 3. KARTU METODE PEMBAYARAN (VERSI MIDTRANS) */}
            <Card className="shadow-sm border-0 rounded-3 card-transaction">
              <Card.Body className="p-4">
                <h5 className="fw-bold text-dark mb-3">Metode Pembayaran</h5>
                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                <p className="text-secondary">
                  Anda akan memilih metode pembayaran (QRIS, Virtual Account, dll) setelah menekan tombol "Bayar Sekarang". 
                  Semua transaksi diproses dengan aman melalui Midtrans.
                </p>
                <img src="https://midtrans.com/assets/img/logo-midtrans-color.png" alt="Midtrans" height="20" />
              </Card.Body>
            </Card>

          </Col>

          {/* 4. Kolom Kanan: Ringkasan Belanja (SAMA) */}
          <Col lg={4}>
            <Card className="shadow-sm border-0 rounded-3 sticky-top" style={{ top: '100px' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold text-dark mb-3">Ringkasan Belanja</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">Subtotal ({items.length} Produk)</span>
                  <span className="fw-bold text-dark small">{subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-secondary small">Ongkos Kirim</span>
                  <span className="fw-bold text-dark small">{shippingCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                </div>
                <hr className="my-3" />
                <div className="d-flex justify-content-between mb-3">
                  <span className="fw-bold text-dark fs-5">Total Bayar</span>
                  <span className="fw-bold text-primary fs-5">
                    {grandTotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </span>
                </div>
                <Button 
                  variant="primary" size="lg" 
                  className="w-100 fw-bold mt-2" 
                  onClick={handleBayar}
                  disabled={isPlacingOrder || items.length === 0 || loading}
                >
                  {isPlacingOrder ? (
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  ) : ( 'Bayar Sekarang' )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal Ubah Alamat (SAMA) */}
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
                  mapContainerStyle={{ width: '100%', height: '250px', borderRadius: '8px' }}
                  center={mapCenter}
                  zoom={10}
                  onLoad={onMapLoad}
                >
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', zIndex: 1 }}>
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

    </div>
  );
}