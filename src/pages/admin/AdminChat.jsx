import { useContext, useEffect, useRef, useState } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import { getAdminConversations, getMessages, sendMessage, updateConversationStatus, deleteConversation } from '../../api/chat';
import { AdminDialog, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';

const STATUS_LABEL = { OPEN: 'Mở', PROCESSING: 'Đang xử lý', COMPLETED: 'Hoàn thành' };

export default function AdminChat() {
  const setPageTitle = useContext(AdminTitleContext);
  useEffect(() => { setPageTitle('Quản lý hội thoại'); }, []);

  const [tab, setTab] = useState('ALL');
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  const { showToast } = useAdminToast();
  const { dialog, confirmDialog, closeDialog } = useAdminDialog();

  useEffect(() => { loadConversations(); }, [tab]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    const timer = setInterval(() => {
      getMessages(activeConv.id).then(setMessages).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [activeConv]);

  useEffect(() => {
    const timer = setInterval(loadConversations, 8000);
    return () => clearInterval(timer);
  }, [tab]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await getAdminConversations(tab === 'ALL' ? '' : tab);
      setConversations(Array.isArray(data) ? data : []);
    } catch (_) {
      showToast({ tone: 'error', title: 'Lỗi', message: 'Không tải được danh sách hội thoại.' });
    } finally { setLoading(false); }
  };

  const openConversation = async (conv) => {
    setActiveConv(conv);
    try {
      const data = await getMessages(conv.id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (_) { setMessages([]); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    const text = input.trim();
    setInput('');
    try {
      const msg = await sendMessage(activeConv.id, { content: text });
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      showToast({ tone: 'error', title: 'Lỗi gửi', message: getAdminErrorMessage(err) });
    }
  };

  const handleStatus = async (conv, status) => {
    const label = STATUS_LABEL[status] || status;
    const accepted = await confirmDialog({
      tone: 'info',
      title: 'Cập nhật trạng thái',
      message: `Chuyển trạng thái hội thoại "${conv.title}" sang "${label}"?`,
      confirmLabel: 'Xác nhận', cancelLabel: 'Hủy',
    });
    if (!accepted) return;
    try {
      await updateConversationStatus(conv.id, { status });
      showToast({ tone: 'success', title: 'Thành công', message: `Đã cập nhật trạng thái sang "${label}".` });
      await loadConversations();
      if (activeConv?.id === conv.id)
        setActiveConv({ ...activeConv, status, statusLabel: label });
    } catch (err) {
      showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(err) });
    }
  };

  const handleDelete = async (conv) => {
    const accepted = await confirmDialog({
      tone: 'error', title: 'Xóa hội thoại',
      message: `Bạn có chắc muốn xóa hội thoại "${conv.title}"? Người dùng sẽ không còn thấy hội thoại này.`,
      confirmLabel: 'Xóa', cancelLabel: 'Hủy',
    });
    if (!accepted) return;
    try {
      await deleteConversation(conv.id);
      showToast({ tone: 'success', title: 'Đã xóa', message: 'Hội thoại đã được xóa.' });
      if (activeConv?.id === conv.id) { setActiveConv(null); setMessages([]); }
      await loadConversations();
    } catch (err) {
      showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(err) });
    }
  };

  const tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'REPORT', label: 'Báo cáo lỗi' },
    { key: 'QA', label: 'Hỏi đáp' },
  ];

  return <>
    <AdminDialog dialog={dialog} onResolve={closeDialog} />

    <div className="search-bar" style={{ marginBottom: 16 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => { setTab(t.key); setActiveConv(null); setMessages([]); }}
          className={`btn btn-sm ${tab === t.key ? 'btn-primary' : ''}`}>
          {t.label}
        </button>
      ))}
    </div>

    <div className="d-flex gap-6 align-start">
      <div className="card" style={{ flex: '0 0 360px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: 8 }}>
        {loading ? <p className="text-muted" style={{ padding: 16, textAlign: 'center' }}>Đang tải...</p> :
         conversations.length === 0 ? <p className="text-muted" style={{ padding: 16, textAlign: 'center' }}>Không có hội thoại.</p> :
         conversations.map(conv => (
          <button key={conv.id} onClick={() => openConversation(conv)}
            style={{
              width: '100%', textAlign: 'left', padding: '12px', marginBottom: 4,
              borderRadius: 'var(--radius-md)', border: '2px solid transparent',
              background: activeConv?.id === conv.id ? 'var(--petgo-orange-light)' : 'transparent',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
            }}>
            <div className="d-flex align-center gap-6" style={{ marginBottom: 4 }}>
              <span className="text-tiny fw-500 text-muted">{conv.typeLabel}</span>
              <span className={`badge ${conv.status === 'COMPLETED' ? 'badge-success' : conv.status === 'PROCESSING' ? 'badge-info' : 'badge-warning'}`} style={{ marginLeft: 'auto' }}>
                {conv.statusLabel}
              </span>
            </div>
            <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.title}</div>
            <div className="text-muted text-tiny">#{conv.userId} - {conv.userName}</div>
            {conv.lastMessage && <div className="text-muted text-tiny" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{conv.lastMessage.content}</div>}
          </button>
        ))}
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 200px)' }}>
        {!activeConv ? (
          <div className="d-flex align-center justify-center" style={{ flex: 1, color: 'var(--text-tertiary)' }}>
            <span className="fw-500">Chọn một hội thoại để xem</span>
          </div>
        ) : (
          <>
            <div className="card-header d-flex align-center" style={{ justifyContent: 'space-between' }}>
              <div>
                <div className="d-flex align-center gap-6" style={{ marginBottom: 2 }}>
                  <span className="text-tiny fw-500 text-muted">{activeConv.typeLabel}</span>
                  <span className={`badge ${activeConv.status === 'COMPLETED' ? 'badge-success' : activeConv.status === 'PROCESSING' ? 'badge-info' : 'badge-warning'}`}>
                    {activeConv.statusLabel}
                  </span>
                </div>
                <div className="card-title">{activeConv.title}</div>
                <div className="text-muted text-tiny">Người dùng: #{activeConv.userId} - {activeConv.userName}</div>
              </div>
              <div className="d-flex gap-6">
                {activeConv.status !== 'PROCESSING' && <button onClick={() => handleStatus(activeConv, 'PROCESSING')} className="btn btn-sm btn-primary">Đang xử lý</button>}
                {activeConv.status !== 'COMPLETED' && <button onClick={() => handleStatus(activeConv, 'COMPLETED')} className="btn btn-sm btn-success">Hoàn thành</button>}
                {activeConv.status !== 'OPEN' && <button onClick={() => handleStatus(activeConv, 'OPEN')} className="btn btn-sm btn-warning">Mở lại</button>}
                <button onClick={() => handleDelete(activeConv)} className="btn btn-sm btn-danger">Xóa</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-secondary)' }}>
              {messages.length === 0 ? <p className="text-muted text-tiny" style={{ textAlign: 'center', padding: 24 }}>Chưa có tin nhắn.</p> :
               messages.map(msg => (
                <div key={msg.id} className="d-flex" style={{ justifyContent: msg.senderId === activeConv.userId ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: 480, borderRadius: 'var(--radius-md)', padding: 12,
                    background: msg.isSystemMessage ? 'var(--bg-tertiary)' : msg.senderId === activeConv.userId ? 'var(--bg-primary)' : 'var(--petgo-orange)',
                    color: msg.isSystemMessage || msg.senderId === activeConv.userId ? 'var(--text-primary)' : '#ffffff',
                    border: msg.isSystemMessage || msg.senderId === activeConv.userId ? '1px solid var(--border-secondary)' : 'none',
                    width: msg.isSystemMessage ? '100%' : 'auto',
                    textAlign: msg.isSystemMessage ? 'center' : 'left',
                    fontStyle: msg.isSystemMessage ? 'italic' : 'normal',
                    fontSize: msg.isSystemMessage ? 12 : 13,
                  }}>
                    <div className="text-tiny fw-500" style={{ marginBottom: 2, opacity: 0.6 }}>{msg.senderName}</div>
                    {msg.errorCode && <div className="text-tiny fw-500" style={{ marginBottom: 4, opacity: 0.7 }}>Mã lỗi: {msg.errorCode}</div>}
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    {msg.imageUrl && <img src={msg.imageUrl} alt="attachment" style={{ marginTop: 8, borderRadius: 12, maxHeight: 240, objectFit: 'cover', maxWidth: '100%' }} />}
                    <div className="text-tiny" style={{ marginTop: 4, opacity: 0.5 }}>{new Date(msg.createdAt).toLocaleString('vi-VN')}</div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="search-bar" style={{ margin: 0, borderTop: '1px solid var(--border-secondary)', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
              <form onSubmit={handleSend} className="d-flex gap-6" style={{ flex: 1, width: '100%' }}>
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Nhập tin nhắn..." style={{ flex: 1 }} />
                <button type="submit" disabled={!input.trim()} className="btn btn-primary">Gửi</button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  </>;
}
