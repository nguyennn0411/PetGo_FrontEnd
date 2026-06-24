import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createConversation, getConversationDetail, getMessages, getMyConversations, sendMessage } from '../api/chat';

const STATUS_LABEL = { OPEN: 'Mở', PROCESSING: 'Đang xử lý', COMPLETED: 'Hoàn thành' };
const TYPE_OPTIONS = [
  { value: 'REPORT', label: 'Báo cáo lỗi', desc: 'Báo cáo lỗi hệ thống, thanh toán, booking...' },
  { value: 'QA', label: 'Hỏi đáp', desc: 'Hỏi đáp thắc mắc về dịch vụ, chính sách...' },
];

export default function ChatPage() {
  const { account } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: 'REPORT', title: '', content: '', imageUrl: '', errorCode: '' });
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await getMyConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (_) { /* ignore */ } finally { setLoading(false); }
  };

  const openConversation = async (conv) => {
    setActiveConv(conv);
    try {
      const data = await getMessages(conv.id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (_) { setMessages([]); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      const payload = { type: form.type, title: form.title.trim(), content: form.content.trim() };
      if (form.imageUrl.trim()) payload.imageUrl = form.imageUrl.trim();
      if (form.errorCode.trim()) payload.errorCode = form.errorCode.trim();
      const conv = await createConversation(payload);
      setShowCreate(false);
      setForm({ type: 'REPORT', title: '', content: '', imageUrl: '', errorCode: '' });
      await loadConversations();
      if (conv?.id) openConversation(conv);
    } catch (_) { /* ignore */ } finally { setSubmitting(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    const text = input.trim();
    setInput('');
    try {
      const msg = await sendMessage(activeConv.id, { content: text });
      setMessages(prev => [...prev, msg]);
    } catch (_) { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-lg font-black">Hỗ trợ & Liên hệ</h1>
          <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600">
            + Tạo mới
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? <p className="text-center text-gray-400 py-8">Đang tải...</p> :
           conversations.length === 0 ? <p className="text-center text-gray-400 py-8">Chưa có hội thoại nào.</p> :
           conversations.map(conv => (
            <button key={conv.id} onClick={() => openConversation(conv)}
              className={`w-full text-left p-3 rounded-2xl transition-all ${activeConv?.id === conv.id ? 'bg-orange-50 border-2 border-orange-200' : 'hover:bg-gray-50 border-2 border-transparent'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">{conv.typeLabel}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${conv.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : conv.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {conv.statusLabel}
                </span>
              </div>
              <p className="font-black text-sm truncate">{conv.title}</p>
              {conv.lastMessage && <p className="text-xs text-gray-500 truncate mt-1">{conv.lastMessage.content}</p>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-5xl mb-4">💬</p>
              <p className="font-black text-lg">Chọn hoặc tạo hội thoại</p>
              <p className="text-sm">Báo cáo lỗi hoặc hỏi đáp thắc mắc</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">{activeConv.typeLabel}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeConv.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : activeConv.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {activeConv.statusLabel}
                  </span>
                </div>
                <h2 className="font-black">{activeConv.title}</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === account?.userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md rounded-2xl p-3 ${msg.isSystemMessage ? 'bg-gray-200 text-gray-600 text-center text-xs w-full max-w-full italic' : msg.senderId === account?.userId ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200'}`}>
                    {msg.errorCode && <div className="text-xs font-black mb-1 opacity-70">Mã lỗi: {msg.errorCode}</div>}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.imageUrl && <img src={msg.imageUrl} alt="attachment" className="mt-2 rounded-xl max-h-60 object-cover" />}
                    <p className="text-[10px] mt-1 opacity-60">{new Date(msg.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {activeConv.status !== 'COMPLETED' ? (
              <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Nhập tin nhắn..." className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm" />
                <button type="submit" disabled={!input.trim()} className="px-5 py-2.5 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 disabled:opacity-50">Gửi</button>
              </form>
            ) : (
              <div className="p-4 bg-gray-100 text-center text-sm text-gray-500 font-semibold">Hội thoại đã kết thúc.</div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black mb-4">Tạo hội thoại mới</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-black text-gray-500 mb-1 block">Loại</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setForm({ ...form, type: opt.value })}
                      className={`p-3 rounded-2xl text-left border-2 transition-all ${form.type === opt.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="font-black text-sm">{opt.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 mb-1 block">Tiêu đề</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ví dụ: Lỗi thanh toán..." className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm" required />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 mb-1 block">Nội dung</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={3} placeholder="Mô tả chi tiết..." className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm resize-none" required />
              </div>
              {form.type === 'REPORT' && (
                <div>
                  <label className="text-xs font-black text-gray-500 mb-1 block">Mã lỗi (nếu có)</label>
                  <input value={form.errorCode} onChange={e => setForm({ ...form, errorCode: e.target.value })} placeholder="Ví dụ: ERR-001" className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm" />
                </div>
              )}
              <div>
                <label className="text-xs font-black text-gray-500 mb-1 block">Link ảnh (nếu có)</label>
                <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 font-black text-sm hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={submitting || !form.title.trim() || !form.content.trim()} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 disabled:opacity-50">
                  {submitting ? 'Đang tạo...' : 'Tạo hội thoại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
