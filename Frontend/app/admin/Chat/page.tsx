// app/admin/chat/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { User, Send, MessageSquare, ArrowLeft, Search } from "lucide-react"; // Tambah ArrowLeft

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0); 

  // --- 1. LOGIC DATA (TIDAK BERUBAH) ---
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversations`);
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/history?userId=${userId}`);
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedUser) fetchMessages(selectedUser.userId);
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      lastMessageCount.current = messages.length;
    }
  }, [messages]);

  const handleUserSelect = (user: any) => {
    setMessages([]); 
    setSelectedUser(user);
    lastMessageCount.current = 0; 
    fetchMessages(user.userId); 
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          senderId: 'admin', senderName: 'Admin Ponti',
          receiverId: selectedUser.userId, text: inputText, isFromAdmin: true
        })
      });
      setInputText("");
      fetchMessages(selectedUser.userId);
    } catch (err) { console.error(err); }
  };


  // --- 2. TAMPILAN RESPONSIF ---
  return (
    // Container utama dibuat seperti kartu besar
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ height: '80vh' }}>
      <div className="row g-0 h-100">
        
        {/* =======================================
            BAGIAN KIRI: DAFTAR USER (INBOX)
            Logic: 
            - Desktop: Selalu muncul (d-md-flex).
            - Mobile: HILANG jika selectedUser ada (d-none).
           ======================================= */}
        <div className={`col-md-4 col-lg-3 border-end h-100 d-flex flex-column bg-white ${selectedUser ? 'd-none d-md-flex' : 'd-flex'}`}>
          
          <div className="p-3 border-bottom">
            <h5 className="fw-bold mb-0">Inbox</h5>
          </div>

          <div className="overflow-auto flex-grow-1 p-2">
            {conversations.length === 0 ? (
               <div className="text-center text-muted mt-5 small">Belum ada chat masuk.</div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.userId}
                  onClick={() => handleUserSelect(conv)}
                  className={`d-flex align-items-center gap-3 p-3 rounded-3 mb-1 cursor-pointer transition-all ${selectedUser?.userId === conv.userId ? 'bg-primary bg-opacity-10 text-primary border-start border-4 border-primary' : 'hover-bg-light text-dark'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${selectedUser?.userId === conv.userId ? 'bg-primary text-white' : 'bg-secondary bg-opacity-10 text-secondary'}`} style={{width: 40, height: 40}}>
                    <User size={20} />
                  </div>
                  <div className="text-truncate" style={{maxWidth: '180px'}}>
                    <div className="fw-bold small">{conv.userName}</div>
                    <small className="opacity-75 d-block text-truncate" style={{fontSize: '11px'}}>
                      {conv.lastMessage.startsWith("#PRODUK#|") 
                          ? "Menanyakan produk..." 
                          : conv.lastMessage}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* =======================================
            BAGIAN KANAN: CHAT ROOM
            Logic:
            - Desktop: Selalu muncul (d-md-flex).
            - Mobile: HILANG jika belum pilih user (d-none).
           ======================================= */}
        <div className={`col-md-8 col-lg-9 h-100 d-flex flex-column bg-white ${!selectedUser ? 'd-none d-md-flex' : 'd-flex'}`}>
          {selectedUser ? (
            <>
              {/* HEADER CHAT */}
              <div className="p-3 border-bottom bg-white d-flex align-items-center gap-3 shadow-sm" style={{zIndex: 10}}>
                
                {/* TOMBOL BACK (Hanya muncul di HP / d-md-none) */}
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="btn btn-light btn-sm rounded-circle d-md-none border"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary text-white rounded-circle p-1 d-flex justify-content-center align-items-center" style={{width: 35, height: 35}}>
                        <User size={18} />
                    </div>
                    <div>
                        <div className="fw-bold text-dark lh-1">{selectedUser.userName}</div>
                        <small className="text-success" style={{fontSize: '10px'}}>● Online</small>
                    </div>
                </div>
              </div>
              
              {/* ISI CHAT (BUBBLE) */}
              <div className="flex-grow-1 p-3 p-md-4 overflow-auto" style={{ background: '#f8f9fa' }}>
                {messages.map((msg, idx) => {
                  
                  const isProductMsg = msg.text.startsWith("#PRODUK#|");
                  let productData = null;
                  let displayMessage = msg.text;

                  if (isProductMsg) {
                      const parts = msg.text.split("|");
                      if (parts.length >= 5) {
                          productData = {
                              nama: parts[1],
                              harga: parts[2],
                              image: parts[3]
                          };
                          displayMessage = parts.slice(4).join("|");
                      }
                  }

                  return (
                    <div key={idx} className={`d-flex mb-3 ${msg.isFromAdmin ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div 
                        className={`p-3 rounded-4 shadow-sm position-relative ${msg.isFromAdmin ? 'bg-primary text-white rounded-br-0' : 'bg-white text-dark rounded-bl-0'}`}
                        style={{ maxWidth: '85%',  whiteSpace: 'pre-wrap' }}
                      >
                        {/* Render Produk Jika Ada */}
                        {productData && (
                          <div className={`d-flex gap-2 mb-2 p-2 rounded-3 ${msg.isFromAdmin ? 'bg-white bg-opacity-25' : 'bg-light border'}`}>
                              <img 
                                  src={productData.image} 
                                  alt={productData.nama}
                                  style={{width: 50, height: 50, objectFit: 'cover', borderRadius: 6, backgroundColor: '#fff'}} 
                              />
                              <div style={{lineHeight: 1.2, overflow: 'hidden'}}>
                                  <div className="fw-bold text-truncate" style={{fontSize: 13}}>{productData.nama}</div>
                                  <div style={{fontSize: 12, opacity: 0.9}}>Rp {parseInt(productData.harga).toLocaleString('id-ID')}</div>
                              </div>
                          </div>
                        )}

                        <div style={{fontSize: '14px'}}>{displayMessage}</div>
                        
                        <div className={`text-end small ${msg.isFromAdmin ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '10px', marginTop: '5px' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* INPUT FORM */}
              <form onSubmit={handleSend} className="p-3 border-top bg-white d-flex gap-2 align-items-center">
                <input 
                  className="form-control rounded-pill bg-light border-0 px-4 py-2"
                  placeholder="Ketik balasan..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: 45, height: 45}}>
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            // Tampilan Kosong (Desktop Only)
            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted bg-light">
              <div className="p-4 bg-white rounded-circle shadow-sm mb-3">
                  <MessageSquare size={48} className="text-primary opacity-50" />
              </div>
              <h5>Pilih Pelanggan</h5>
              <p className="small">Klik nama di sebelah kiri untuk chat.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
