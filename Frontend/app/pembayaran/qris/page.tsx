// app/pembayaran/qris/page.tsx
'use client';

import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function QrisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Ambil data dari URL
  const orderId = searchParams.get('orderId');
  const totalAmount = searchParams.get('total');

  // Format total harga
  const formattedTotal = Number(totalAmount).toLocaleString('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  });

  const handleSudahBayar = () => {
    // Arahkan ke halaman pembelian
    router.push('/pembelian');
  };

  return (
    <div className="w-100 py-5" style={{ backgroundColor: '#E5E9F0', minHeight: '100vh' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-sm border-0 rounded-3">
              <Card.Body className="p-4 p-md-5 text-center">
                
                <h3 className="fw-bold text-dark mb-3">Scan untuk Membayar</h3>
                <p className="text-secondary">
                  Silakan scan QRIS di bawah ini menggunakan aplikasi Bank atau e-Wallet Anda.
                </p>

                <Alert variant="warning" className="fw-bold fs-5 text-center">
                  Total Bayar: {formattedTotal}
                </Alert>
                
                {/* NANTI: Ganti 'src' ini dengan path ke file QRIS statis Anda 
                  Misalnya: /images/qris-ponti-jaya.png
                */}
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ContohQRIS-PontiJayaMotor" 
                  alt="Kode QRIS"
                  className="img-fluid rounded-3 border p-2 mb-3"
                  style={{ maxWidth: '300px' }}
                />

                <p className="text-muted small">
                  Nomor Pesanan Anda: <br/>
                  <strong className="text-dark">{orderId}</strong>
                </p>

                <hr className="my-4" />

                <p className="fw-bold text-dark">Sudah Selesai Membayar?</p>
                <p className="text-secondary small">
                  Pesanan Anda akan kami proses setelah pembayaran terkonfirmasi oleh tim kami.
                </p>

                <Button 
                  variant="primary" 
                  className="w-100 fw-bold" 
                  size="lg"
                  onClick={handleSudahBayar}
                >
                  Saya Sudah Bayar
                </Button>
                
              </Card.Body>
            </Card>
            <div className="text-center mt-3">
              <Link href="/pembelian" className="text-secondary small">
                Cek Status Pesanan Nanti
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}