// app/admin/chat/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { User, Send, MessageSquare } from "lucide-react";

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0); 

  // 1. Ambil Daftar User (Tidak berubah)
  const fetchConversations = async () => {
    try {
      const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversations');
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch (err) { console.error(err); }
  };

  // 2. Ambil Isi Chat (Tidak berubah)
  const fetchMessages = async (userId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/history?userId=${userId}`);
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } catch (err) { console.error(err); }
  };

  // Polling (Tidak berubah)
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedUser) fetchMessages(selectedUser.userId);
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  // Scroll pintar (Tidak berubah)
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      lastMessageCount.current = messages.length;
    }
  }, [messages]);


  const handleUserSelect = (user: any) => {
    setMessages([]); // Kosongkan chat lama (biar UI cepat bersih)
    setSelectedUser(user); // Ganti user
    lastMessageCount.current = 0; // Reset pelacak scroll
    fetchMessages(user.userId); // biar ga nghelag
  };


  // Kirim pesan (Tidak berubah)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;
    try {
      await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/messages/send', {
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

  return (
    <div className="d-flex gap-3" style={{ height: '80vh' }}>
      
      {/* LIST USER (KIRI) */}
      <div className="bg-white rounded-4 shadow-sm p-3 d-flex flex-column" style={{ width: '300px' }}>
        <h5 className="fw-bold mb-3 px-2">Inbox</h5>
        <div className="overflow-auto flex-grow-1">
          {conversations.length === 0 ? (
             <div className="text-center text-muted mt-5">Belum ada chat masuk.</div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.userId}
                onClick={() => handleUserSelect(conv)}
                className={`d-flex align-items-center gap-3 p-3 rounded-3 mb-2 cursor-pointer ${selectedUser?.userId === conv.userId ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                style={{ cursor: 'pointer' }}
              >
                <div className={`rounded-circle p-2 ${selectedUser?.userId === conv.userId ? 'bg-white text-primary' : 'bg-secondary text-white'}`}>
                  <User size={20} />
                </div>
                <div className="text-truncate" style={{maxWidth: '180px'}}>
                  <div className="fw-bold">{conv.userName}</div>
                  <small className="opacity-75 d-block text-truncate">
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

      <div className="bg-white rounded-4 shadow-sm flex-grow-1 d-flex flex-column overflow-hidden">
        {selectedUser ? (
          <>
            {/* Header Chat */}
            <div className="p-3 border-bottom bg-light fw-bold text-dark">
              Chat dengan: {selectedUser.userName}
            </div>
            
            {/* Bubble Chat */}
            <div className="flex-grow-1 p-4 overflow-auto" style={{ background: '#f8f9fa' }}>
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
                      className={`p-3 rounded-4 shadow-sm ${msg.isFromAdmin ? 'bg-primary text-white rounded-br-0' : 'bg-white text-dark rounded-bl-0'}`}
                      style={{ maxWidth: '70%', whiteSpace: 'pre-wrap' }}
                    >
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

                      <div>{displayMessage}</div>
                      
                      <div className="text-end" style={{ fontSize: '10px', opacity: 0.7, marginTop: '5px' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input Chat */}
            <form onSubmit={handleSend} className="p-3 border-top bg-white d-flex gap-2">
              <input 
                className="form-control rounded-pill bg-light border-0 px-4"
                placeholder="Ketik balasan..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary rounded-circle p-3">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
            <MessageSquare size={64} className="mb-3 text-light-emphasis" />
            <h5>Pilih user untuk mulai membalas</h5>
          </div>
        )}
      </div>
    </div>
  );
}