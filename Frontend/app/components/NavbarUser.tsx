// app/components/NavbarUser.tsx
'use client';

import { 
  Navbar, Nav, Container, NavDropdown, Modal, Button, Form, 
  Row, Col, InputGroup, Spinner, Alert 
} from 'react-bootstrap';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { User, Phone, Home as HomeIcon, MapPin } from 'lucide-react';
import { useJsApiLoader, GoogleMap, Autocomplete } from '@react-google-maps/api';

interface MapCenter {
  lat: number;
  lng: number;
}
const defaultCenter: MapCenter = {
  lat: -6.2088,
  lng: 106.8456
};
const libraries: ("places")[] = ['places'];

function NavbarUser() {
  const [userName, setUserName] = useState("Memuat...");
  const [userId, setUserId] = useState<string | null>(null);

  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [nama, setNama] = useState("");
  const [telpon, setTelpon] = useState("");
  const [alamat, setAlamat] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<MapCenter>(defaultCenter);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: libraries,
  });

  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo");
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      setUserName(userInfo.username || "User");
      setUserId(userInfo.userId || null);
    }
  }, []);

  // Fungsi baru untuk mengubah alamat string menjadi koordinat
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
        console.warn(`Geocode gagal untuk alamat '${addressString}': ${status}`);
        setMapCenter(defaultCenter);
        map?.panTo(defaultCenter);
        map?.setZoom(10);
      }
    });
  };

  // Fungsi untuk memuat data profil dari DB
  const loadUserDataFromDB = async () => {
    if (!userId) return;
    
    setIsLoadingData(true);
    setModalMessage(null);
    try {
      // Anda perlu mengganti ini dengan endpoint yang benar jika sudah ada
      const response = await fetch(`http://localhost:5000/api/users/profile?userId=${userId}`);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal memuat profil');
      }

      const userData = data.data;
      setNama(userData.username || "");
      setTelpon(userData.telpon || "");
      setAlamat(userData.alamat || "");
      
      return userData.alamat || null; 
      
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
      return null;
    } finally {
      setIsLoadingData(false);
    }
  };

  // Kontrol Modal
  const handleShowProfileModal = async () => {
    setShowProfileModal(true);
    const alamatFromDB = await loadUserDataFromDB(); 

    if (alamatFromDB && isLoaded) {
      geocodeAddress(alamatFromDB);
    } else if (!alamatFromDB) {
      setMapCenter(defaultCenter);
      map?.panTo(defaultCenter);
      map?.setZoom(10);
    }
  };
  
  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  // Fungsi Simpan Perubahan ke DB
  const handleSaveChanges = async () => {
    if (!userId) {
      setModalMessage({ type: 'error', text: 'User ID tidak ditemukan. Harap login ulang.' });
      return;
    }
    setIsSaving(true);
    setModalMessage(null);
    try {
      // Anda perlu mengganti ini dengan endpoint yang benar jika sudah ada
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          username: nama, 
          telpon: telpon,
          alamat: alamat
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan profil');
      }
      setUserName(data.data.username);
      const userInfoString = localStorage.getItem("userInfo");
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        userInfo.username = data.data.username; 
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
      }
      setModalMessage({ type: 'success', text: 'Profil berhasil disimpan!' });
      setTimeout(() => {
        handleCloseProfileModal();
      }, 1500);
    } catch (error: any) {
      setModalMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Fungsi Google Maps
  const onMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    if (alamat) {
      geocodeAddress(alamat);
    }
  };
  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocompleteInstance;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (!place || !place.geometry || !place.geometry.location) {
        console.warn("Autocomplete error: User tidak memilih saran (mungkin menekan Enter).");
        setModalMessage({ type: 'error', text: 'Harap pilih alamat dari daftar saran yang muncul.' });
        return; 
      }
      
      if(modalMessage?.type === 'error') setModalMessage(null);

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setAlamat(place.formatted_address || "");
      setMapCenter({ lat, lng });
      map?.panTo({ lat, lng });
      map?.setZoom(15);
    }
  };

  return (
    <>
      <Navbar 
        bg="dark" 
        variant="dark" 
        expand="lg" 
        sticky="top"
        className="main-navbar"
      >
        <Container className="container-figma"> 
          <Navbar.Brand as={Link} href="/" className="fw-bold" style={{ letterSpacing: '1px' }}>
            PONTI JAYA MOTOR
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Link href="/#hero" className="nav-link mx-2">Home</Link>
              <Link href="/#jasa" className="nav-link mx-2">Jasa</Link>
              <Link href="/produk" className="nav-link mx-2">Produk</Link> 
              <Link href="/#hubungi" className="nav-link mx-2">Hubungi Kami</Link>
              <NavDropdown 
                title={
                  <div 
                    className="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                    style={{ width: '40px', height: '40px' }}
                  >
                    <i className="bi bi-person-fill text-white fs-5"></i>
                  </div>
                } 
                id="user-dropdown" 
                align="end"
                className="user-avatar-dropdown"
                menuVariant="dark" 
              >
                <NavDropdown.Item 
                  onClick={handleShowProfileModal} 
                  className="dropdown-user-item"
                >
                  {userName}
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/pembelian" className="dropdown-user-item">
                  Pembelian
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/keranjang" className="dropdown-user-item">
                  Keranjang
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/logout" className="dropdown-user-logout">
                  Keluar
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Modal Profil */}
      <Modal show={showProfileModal} onHide={handleCloseProfileModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Edit Profil Saya</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isLoadingData ? (
            <div className="text-center p-5">
              <Spinner animation="border" />
              <p className="mt-2 text-muted">Memuat data...</p>
            </div>
          ) : (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted d-flex align-items-center gap-2">
                      <User size={16} /> Nama Pengguna (Username)
                    </Form.Label>
                    <Form.Control 
                      type="text" 
                      value={nama} 
                      onChange={(e) => setNama(e.target.value)} 
                      disabled={isSaving}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted d-flex align-items-center gap-2">
                      <Phone size={16} /> Nomor Telepon
                    </Form.Label>
                    <Form.Control 
                      type="tel" 
                      placeholder="Misal: 081234567890" 
                      value={telpon} 
                      onChange={(e) => setTelpon(e.target.value)} 
                      disabled={isSaving}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted d-flex align-items-center gap-2">
                  <HomeIcon size={16} /> Alamat Pengiriman
                </Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  placeholder="Masukkan alamat lengkap Anda..." 
                  value={alamat} 
                  onChange={(e) => setAlamat(e.target.value)} 
                  disabled={isSaving}
                  className="mb-2"
                />
              </Form.Group>

              {!isLoaded && !loadError && <p className="text-muted small">Memuat peta...</p>}
              {loadError && <Alert variant="danger" className="small py-2">Error memuat Google Maps. Pastikan API Key Anda benar.</Alert>}
              
              {/* === PERUBAHAN STRUKTUR DI SINI === */}
              {isLoaded && (
                <div className="maps-container">
                  
                  {/* InputGroup sekarang membungkus Autocomplete */}
                  <InputGroup className="mb-2 shadow-sm">
                    <InputGroup.Text><MapPin size={16} /></InputGroup.Text>
                    
                    {/* Autocomplete HANYA membungkus Form.Control */}
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
              {/* === AKHIR PERUBAHAN === */}
            </Form>
          )}
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
          <Button variant="outline-secondary" onClick={handleCloseProfileModal} disabled={isSaving}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSaveChanges} disabled={isSaving || isLoadingData} className="fw-bold">
            {isSaving ? <Spinner as="span" size="sm" /> : "Simpan Perubahan"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default NavbarUser;