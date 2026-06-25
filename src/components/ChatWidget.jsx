import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { createConversation, getMyConversations, getMessages, sendMessage, uploadChatImage } from '../api/chat';

const STATUS_LABEL = { OPEN: 'Mở', PROCESSING: 'Đang xử lý', COMPLETED: 'Hoàn thành' };

export default function ChatWidget({ open: controlledOpen, setOpen: controlledSetOpen }) {
  const { account } = useContext(AuthContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setLocalOpen;
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ type: 'QA', title: '', content: '', errorCode: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [dragZone, setDragZone] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => { if (open) loadConversations(); }, [open]);

  useEffect(() => {
    if (!open || !activeConv) return;
    getMessages(activeConv.id).then(d => setMessages(sortMessages(d))).catch(() => {});
    const timer = setInterval(() => {
      getMessages(activeConv.id).then(d => setMessages(sortMessages(d))).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [activeConv, open]);

  useEffect(() => {
    if (!open) return;
    if (!activeConv) {
      const timer = setInterval(loadConversations, 8000);
      return () => clearInterval(timer);
    }
  }, [open, activeConv]);

  useEffect(() => {
    if (!open) {
      setActiveConv(null);
      setMessages([]);
      setShowNew(false);
      setPreviewImage(null);
    }
  }, [open]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    });
  };

  useLayoutEffect(scrollToBottom, [messages]);

  const loadConversations = async () => {
    try {
      const data = await getMyConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch {}
  };

  const sortMessages = (data) =>
    (Array.isArray(data) ? data : []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const openConversation = async (conv) => {
    setActiveConv(conv);
    try {
      const data = await getMessages(conv.id);
      setMessages(sortMessages(data));
      scrollToBottom();
    } catch { setMessages([]); }
  };

  const doSendMessage = useCallback(async (text, imageUrl) => {
    if (!activeConv) return;
    try {
      const msg = await sendMessage(activeConv.id, { content: text, imageUrl: imageUrl || undefined });
      setMessages(prev => [...prev, msg]);
    } catch {}
  }, [activeConv]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeConv) return;
    if (previewImage) {
      setUploadingImage(true);
      try {
        const url = await uploadChatImage(previewImage);
        if (url) await doSendMessage(input.trim() || '[Hình ảnh]', url);
      } catch {} finally { setUploadingImage(false); setPreviewImage(null); setInput(''); }
    } else if (input.trim()) {
      await doSendMessage(input.trim());
      setInput('');
    }
  };

  const handleCreate = async (e, overrideType) => {
    if (e?.preventDefault) e.preventDefault();
    const type = overrideType || form.type;
    setSubmitting(true);
    try {
      let payload;
      if (type === 'QA') {
        const now = new Date();
        const ts = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
        payload = { type: 'QA', title: 'Hỗ trợ & tư vấn (' + ts + ' ' + now.toLocaleDateString('vi-VN') + ')', content: 'Tôi cần được hỗ trợ thêm về dịch vụ.' };
      } else {
        if (!form.title.trim() || !form.content.trim()) return;
        payload = { type: 'REPORT', title: form.title.trim(), content: form.content.trim() };
        if (form.errorCode?.trim()) payload.errorCode = form.errorCode.trim();
      }
      const conv = await createConversation(payload);
      setShowNew(false);
      setForm({ type: 'QA', title: '', content: '', errorCode: '' });
      await loadConversations();
      if (conv?.id) openConversation(conv);
    } catch {} finally { setSubmitting(false); }
  };

  const quickSendImage = useCallback(async (file) => {
    if (!activeConv || activeConv.status === 'COMPLETED' || !file.type.startsWith('image/')) return;
    setUploadingImage(true);
    try {
      const url = await uploadChatImage(file);
      if (url) await doSendMessage('[Hình ảnh]', url);
    } catch {} finally { setUploadingImage(false); }
  }, [activeConv, doSendMessage]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) { setPreviewImage(file); }
        break;
      }
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) setPreviewImage(file);
    e.target.value = '';
  }, []);

  const handleBodyDragOver = useCallback((e) => { e.preventDefault(); setDragZone('body'); }, []);
  const handleBodyDragLeave = useCallback(() => { setDragZone(prev => prev === 'body' ? null : prev); }, []);
  const handleBodyDrop = useCallback((e) => {
    e.preventDefault();
    setDragZone(null);
    const file = e.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) quickSendImage(file);
  }, [quickSendImage]);

  const handleFooterDragOver = useCallback((e) => { e.preventDefault(); setDragZone('footer'); }, []);
  const handleFooterDragLeave = useCallback(() => { setDragZone(prev => prev === 'footer' ? null : prev); }, []);
  const handleFooterDrop = useCallback((e) => {
    e.preventDefault();
    setDragZone(null);
    const file = e.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) setPreviewImage(file);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setActiveConv(null);
    setMessages([]);
    setShowNew(false);
    setPreviewImage(null);
  };

  if (!account) return null;

  const showConvView = activeConv || showNew;

  return (
    <>
      <style>{`@keyframes uploadProgress { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }`}</style>
      <button onClick={() => setOpen(!open)} style={{
        ...styles.fab,
        background: open ? '#f97316' : '#1f2937',
        boxShadow: open ? '0 0 15px rgba(249, 115, 22, 0.6)' : styles.fab.boxShadow
      }} aria-label={open ? "Đóng chat hỗ trợ" : "Mở chat hỗ trợ"}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {open && (
        <div style={styles.panel} onPaste={handlePaste}>
          {uploadingImage && <div style={styles.uploadBar}><div style={styles.uploadBarInner} /></div>}

            {/* Header */}
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                {activeConv && (
                  <button onClick={() => { setActiveConv(null); setMessages([]); setPreviewImage(null); }} style={styles.backBtn} title="Quay lại">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}
                <div style={styles.avatar}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <div style={styles.title}>
                    {activeConv ? activeConv.title : showNew ? 'Tạo hội thoại' : 'Hỗ trợ PetGo'}
                  </div>
                  <div style={styles.subtitle}>
                    {activeConv
                      ? STATUS_LABEL[activeConv.status] || activeConv.status
                      : showNew ? '' : 'Phản hồi trong 2 phút'}
                  </div>
                </div>
              </div>
              <div style={styles.headerActions}>
                <button onClick={handleClose} style={styles.iconBtn} title="Đóng">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            {activeConv ? (
              <>
                <div ref={bodyRef} style={styles.body}
                  onDragOver={handleBodyDragOver} onDragLeave={handleBodyDragLeave} onDrop={handleBodyDrop}>
                  {dragZone === 'body' && <div style={styles.quickOverlay}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><div style={{ fontWeight: 800, fontSize: 13, marginTop: 6 }}>Thả để gửi nhanh</div></div>}
                  {messages.length === 0 ? (
                    <p style={styles.emptyMsg}>Chưa có tin nhắn nào.</p>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} style={{
                        ...styles.msgRow,
                        justifyContent: msg.senderId === account.userId ? 'flex-end' : 'flex-start',
                      }}>
                        <div style={{
                          ...styles.bubble,
                          ...(msg.senderId === account.userId ? styles.userBubble : styles.adminBubble),
                          ...(msg.isSystemMessage ? styles.systemBubble : {}),
                        }}>
                          {msg.isSystemMessage ? (
                            <span style={styles.systemText}>{msg.content}</span>
                          ) : (
                            <>
                              {msg.senderId !== account.userId && (
                                <div style={styles.senderName}>{msg.senderName}</div>
                              )}
                              {msg.errorCode && <div style={styles.errorCode}>Mã lỗi: {msg.errorCode}</div>}
                              <div>{msg.content}</div>
                              {msg.imageUrl && (
                                <img src={msg.imageUrl} alt="" style={styles.msgImage} />
                              )}
                            </>
                          )}
                          <div style={styles.time}>{new Date(msg.createdAt).toLocaleString('vi-VN')}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>
                {activeConv.status !== 'COMPLETED' ? (
                  <form onSubmit={handleSend} onDragOver={handleFooterDragOver} onDragLeave={handleFooterDragLeave} onDrop={handleFooterDrop} style={{ ...styles.footer, flexDirection: 'column', gap: 0 }}>
                    {dragZone === 'footer' && <div style={styles.previewOverlay}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span style={{ fontWeight: 700, fontSize: 12, marginLeft: 6 }}>Thả để xem trước</span></div>}
                    {previewImage && (
                      <div style={styles.previewRow}>
                        <div style={styles.previewThumb}>
                          <img src={URL.createObjectURL(previewImage)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setPreviewImage(null)} style={styles.previewRemove}>&times;</button>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                      <button type="button" onClick={() => fileRef.current?.click()} style={styles.imageBtn} title="Chọn ảnh">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                      <input value={input} onChange={e => setInput(e.target.value)} placeholder={previewImage ? 'Thêm ghi chú...' : 'Nhập tin nhắn...'} style={styles.input} />
                      <button type="submit" disabled={(!input.trim() && !previewImage) || uploadingImage} style={{ ...styles.sendBtn, opacity: (!input.trim() && !previewImage) || uploadingImage ? 0.5 : 1 }}>{uploadingImage ? '...' : 'Gửi'}</button>
                    </div>
                  </form>
                ) : (
                  <div style={styles.footer}>
                    <span style={{ fontSize: 12, color: '#999', fontWeight: 600 }}>Hội thoại đã kết thúc.</span>
                  </div>
                )}
              </>
            ) : showNew ? (
              <div style={styles.body}>
                <div style={styles.newConvForm}>
                  <div style={styles.newConvTitle}>Tạo hội thoại mới</div>
                  <div style={styles.typeGroup}>
                    <button type="button" onClick={() => handleCreate(null, 'QA')} disabled={submitting}
                      style={{ ...styles.typeBtn, ...styles.typeBtnQa }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>Hỏi đáp</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Bấm một chạm để bắt đầu</div>
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, type: 'REPORT' })}
                      style={{ ...styles.typeBtn, ...(form.type === 'REPORT' ? styles.typeBtnActive : {}) }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>Báo cáo lỗi</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Gửi báo cáo chi tiết</div>
                    </button>
                  </div>
                  {form.type === 'REPORT' && (
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                      <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Tiêu đề báo lỗi" style={styles.newInput} required />
                      <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={3} placeholder="Mô tả chi tiết lỗi..." style={{ ...styles.newInput, resize: 'none' }} required />
                      <input value={form.errorCode || ''} onChange={e => setForm({ ...form, errorCode: e.target.value })} placeholder="Mã lỗi (nếu có)" style={styles.newInput} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setShowNew(false)} style={styles.cancelBtn}>Hủy</button>
                        <button type="submit" disabled={submitting || !form.title.trim() || !form.content.trim()} style={styles.submitBtn}>
                          {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.body}>
                <div style={styles.convList}>
                  <div style={styles.listHeader}>
                    <span style={{ fontWeight: 900, fontSize: 13, color: '#666' }}>Hội thoại của bạn</span>
                    <button onClick={() => setShowNew(true)} style={styles.newBtn}>+ Tạo mới</button>
                  </div>
                  {conversations.length === 0 ? (
                    <div style={styles.emptyState}>
                      <p style={{ fontWeight: 700, color: '#999', marginBottom: 4 }}>Chưa có hội thoại nào</p>
                      <p style={{ fontSize: 12, color: '#bbb' }}>Tạo hội thoại để liên hệ với admin</p>
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <button key={conv.id} onClick={() => openConversation(conv)} style={styles.convItem}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{conv.typeLabel}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 999,
                            background: conv.status === 'COMPLETED' ? '#d1fae5' : conv.status === 'PROCESSING' ? '#dbeafe' : '#fef3c7',
                            color: conv.status === 'COMPLETED' ? '#065f46' : conv.status === 'PROCESSING' ? '#1e40af' : '#92400e',
                          }}>{conv.statusLabel}</span>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: 13, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.title}</div>
                        {conv.lastMessage && (
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.lastMessage.content}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
      )}
    </>
  );
}

const styles = {
  fab: {
    position: 'fixed', right: 24, bottom: 92, width: 56, height: 56, borderRadius: '50%',
    border: 'none', background: '#1f2937', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 10px 30px rgba(31, 41, 55, 0.4)', cursor: 'pointer', zIndex: 9999,
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 9999,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 24,
  },
  panel: {
    position: 'fixed', right: 92, bottom: 24, zIndex: 9999,
    width: 400, maxWidth: 'calc(100vw - 110px)', height: 560, maxHeight: 'calc(100vh - 48px)',
    background: '#fff', borderRadius: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.25)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  },
  header: {
    padding: '14px 16px', background: '#1f2937', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 30, height: 30, borderRadius: '50%', border: 'none',
    background: 'rgba(255,255,255,0.12)', color: '#fff',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginRight: -4,
  },
  avatar: {
    width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontWeight: 800, fontSize: 15 },
  subtitle: { fontSize: 11, opacity: 0.7, marginTop: 1 },
  headerActions: { display: 'flex', gap: 4 },
  iconBtn: {
    width: 32, height: 32, borderRadius: '50%', border: 'none',
    background: 'rgba(255,255,255,0.1)', color: '#fff',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: 14, position: 'relative',
  },
  convList: { flex: 1, display: 'flex', flexDirection: 'column' },
  listHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  newBtn: {
    padding: '5px 12px', borderRadius: 999, border: 'none',
    background: '#f97316', color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer',
  },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  convItem: {
    width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 4,
    borderRadius: 14, border: 'none', background: 'transparent', cursor: 'pointer',
  },
  emptyMsg: { textAlign: 'center', color: '#999', fontSize: 13, padding: 24, fontWeight: 600 },
  msgRow: { display: 'flex', marginBottom: 10 },
  bubble: { maxWidth: '80%', padding: '8px 12px', borderRadius: 14, fontSize: 13, lineHeight: 1.45, wordBreak: 'break-word' },
  userBubble: { background: '#f97316', color: '#fff', borderBottomRightRadius: 5 },
  adminBubble: { background: '#f3f4f6', color: '#1f2937', borderBottomLeftRadius: 5 },
  systemBubble: { background: '#f3f4f6', color: '#666', width: '100%', maxWidth: '100%', textAlign: 'center', fontStyle: 'italic', fontSize: 11 },
  systemText: { fontSize: 11 },
  senderName: { fontSize: 10, fontWeight: 800, color: '#f97316', marginBottom: 2 },
  errorCode: { fontSize: 10, fontWeight: 700, opacity: 0.6, marginBottom: 2 },
  msgImage: { marginTop: 6, borderRadius: 10, maxHeight: 160, objectFit: 'cover', maxWidth: '100%' },
  time: { fontSize: 9, marginTop: 4, opacity: 0.5 },
  footer: {
    padding: '10px 14px', borderTop: '1px solid #e5e7eb', background: '#fff',
    position: 'relative',
  },
  input: {
    flex: 1, padding: '8px 12px', borderRadius: 999, border: '1px solid #e5e7eb',
    outline: 'none', fontSize: 13, fontFamily: 'inherit',
  },
  imageBtn: {
    width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e7eb',
    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#666', flexShrink: 0,
  },
  sendBtn: {
    padding: '8px 16px', borderRadius: 999, border: 'none',
    background: '#f97316', color: '#fff', fontWeight: 800, fontSize: 12,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  newConvForm: { display: 'flex', flexDirection: 'column', gap: 10, padding: 4 },
  newConvTitle: { fontWeight: 900, fontSize: 16, marginBottom: 4 },
  typeGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  typeBtn: { padding: 10, borderRadius: 12, border: '2px solid #e5e7eb', background: '#fff', cursor: 'pointer', textAlign: 'left' },
  typeBtnActive: { borderColor: '#f97316', background: '#fff7ed' },
  typeBtnQa: { borderColor: '#22c55e', background: '#f0fdf4', cursor: 'pointer' },
  newInput: { padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', outline: 'none', fontSize: 13, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  cancelBtn: { flex: 1, padding: '10px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' },
  submitBtn: { flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: '#f97316', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' },
  uploadBar: { height: 3, background: '#fef3c7', overflow: 'hidden' },
  uploadBarInner: { height: '100%', width: '30%', background: '#f97316', borderRadius: 2, animation: 'uploadProgress 1s ease-in-out infinite' },
  quickOverlay: {
    position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(249,115,22,0.06)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    color: '#f97316', pointerEvents: 'none',
  },
  previewOverlay: {
    padding: '6px 0', textAlign: 'center', color: '#f97316',
    background: '#fff7ed', borderBottom: '1px solid #fed7aa',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  previewRow: { padding: '6px 0', borderBottom: '1px dashed #e5e7eb', marginBottom: 6 },
  previewThumb: {
    width: 64, height: 64, borderRadius: 10, overflow: 'hidden', position: 'relative',
    border: '1px solid #e5e7eb', background: '#f9fafb',
  },
  previewRemove: {
    position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%',
    border: 'none', background: '#ef4444', color: '#fff', fontSize: 12,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1,
  },
};
