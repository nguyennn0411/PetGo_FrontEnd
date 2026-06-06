import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ImagePlus, Loader2, MessageCircle, RefreshCw, Send, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteChatMessage, getChatConversations, getChatMessages, markChatAsRead, sendChatImage, sendChatMessage } from '../api/chat';
import { AuthContext } from '../context/AuthContext';
import { resolveUserId } from '../utils/userIdentity';

const ChatPage = () => {
    const navigate = useNavigate();
    const { conversationId } = useParams();
    const { account, loadingAccount } = useContext(AuthContext);
    const currentUserId = useMemo(() => resolveUserId(account), [account]);

    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId] = useState(conversationId ? Number(conversationId) : null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState('');

    const activeConversation = conversations.find((item) => item.id === activeId) || null;

    const loadConversations = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getChatConversations();
            const list = Array.isArray(data) ? data : [];
            setConversations(list);
            if (!activeId && list.length) setActiveId(list[0].id);
        } catch (err) {
            setError(err?.response?.data?.message || 'Không tải được danh sách chat.');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (id = activeId) => {
        if (!id) {
            setMessages([]);
            return;
        }
        setMessagesLoading(true);
        setError('');
        try {
            const data = await getChatMessages(id);
            setMessages(Array.isArray(data) ? data : []);
            await markChatAsRead(id).catch(() => null);
        } catch (err) {
            setError(err?.response?.data?.message || 'Không tải được tin nhắn.');
        } finally {
            setMessagesLoading(false);
        }
    };

    useEffect(() => {
        if (loadingAccount) return;
        if (!account) {
            navigate('/login', { state: { redirectTo: conversationId ? `/chat/${conversationId}` : '/chat' } });
            return;
        }
        loadConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingAccount, account]);

    useEffect(() => {
        if (conversationId) setActiveId(Number(conversationId));
    }, [conversationId]);

    useEffect(() => {
        if (!activeId) return;
        loadMessages(activeId);
        if (String(activeId) !== conversationId) navigate(`/chat/${activeId}`, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    const handleSend = async (event) => {
        event.preventDefault();
        const content = draft.trim();
        if (!content || !activeId) return;
        try {
            setSending(true);
            const sent = await sendChatMessage(activeId, content);
            setMessages((prev) => [...prev, sent]);
            setDraft('');
            await loadConversations();
        } catch (err) {
            setError(err?.response?.data?.message || 'Gửi tin nhắn thất bại.');
        } finally {
            setSending(false);
        }
    };

    const handleImageChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !activeId) return;
        try {
            setUploadingImage(true);
            const sent = await sendChatImage(activeId, file);
            setMessages((prev) => [...prev, sent]);
            await loadConversations();
            await loadMessages(activeId);
        } catch (err) {
            setError(err?.response?.data?.message || 'Gửi ảnh thất bại.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!activeId || !messageId || !window.confirm('Xóa tin nhắn này?')) return;
        try {
            const deleted = await deleteChatMessage(activeId, messageId);
            setMessages((prev) => prev.filter((message) => message.id !== deleted.id));
            await loadConversations();
        } catch (err) {
            setError(err?.response?.data?.message || 'Xóa tin nhắn thất bại.');
        }
    };

    if (loadingAccount || loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="px-4 py-3 rounded-2xl bg-white border border-gray-100 font-black text-sm flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Quay lại
                    </button>
                    <button onClick={() => { loadConversations(); loadMessages(); }} className="px-4 py-3 rounded-2xl bg-orange-50 text-orange-600 font-black text-sm flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {error && <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600 font-bold">{error}</div>}

                <div className="grid lg:grid-cols-[360px_1fr] gap-6 min-h-[70vh]">
                    <aside className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h1 className="text-2xl font-black flex items-center gap-2"><MessageCircle className="w-6 h-6 text-orange-500" /> Chat</h1>
                            <p className="text-sm text-gray-400 font-semibold mt-1">REST chat cơ bản, có thể refresh để nhận tin mới.</p>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {conversations.length ? conversations.map((conversation) => (
                                <button key={conversation.id} onClick={() => setActiveId(conversation.id)} className={`w-full p-5 text-left hover:bg-orange-50 transition-all ${activeId === conversation.id ? 'bg-orange-50' : ''}`}>
                                    <div className="font-black text-gray-900">{conversation.title || 'Conversation'}</div>
                                    <div className="text-xs text-gray-400 font-bold mt-1 uppercase">{conversation.type}</div>
                                    <div className="text-sm text-gray-500 font-medium mt-2 line-clamp-2">{conversation.lastMessagePreview || 'Chưa có tin nhắn.'}</div>
                                </button>
                            )) : (
                                <div className="p-8 text-center text-gray-400 font-bold">Chưa có conversation. Hãy bắt đầu từ nút chat ở provider hoặc Help Center.</div>
                            )}
                        </div>
                    </aside>

                    <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="text-xl font-black">{activeConversation?.title || 'Chọn conversation'}</h2>
                            <p className="text-xs text-gray-400 font-bold mt-1">{activeConversation?.participants?.map((p) => p.fullName).filter(Boolean).join(', ')}</p>
                        </div>
                        <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-gray-50/60">
                            {messagesLoading ? <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" /> : messages.length ? messages.map((message) => {
                                const mine = Number(message.senderId) === Number(currentUserId);
                                return (
                                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-[1.5rem] px-5 py-3 ${mine ? 'bg-orange-500 text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className={`text-[10px] font-black uppercase mb-1 ${mine ? 'text-white/70' : 'text-gray-400'}`}>{message.senderName || 'Người gửi'}</div>
                                                {message.canDelete && (
                                                    <button type="button" onClick={() => handleDeleteMessage(message.id)} className={`text-[10px] font-black ${mine ? 'text-white/80 hover:text-white' : 'text-red-400 hover:text-red-600'}`} title="Xóa tin nhắn">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            {message.messageType === 'IMAGE' && message.attachmentUrl ? (
                                                <a href={message.attachmentUrl} target="_blank" rel="noreferrer">
                                                    <img src={message.attachmentUrl} alt="Ảnh chat" className="max-h-72 rounded-2xl object-contain bg-white/20" />
                                                </a>
                                            ) : (
                                                <div className="font-semibold whitespace-pre-wrap break-words">{message.content}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : <div className="h-full flex items-center justify-center text-gray-400 font-bold">Chưa có tin nhắn.</div>}
                        </div>
                        <form onSubmit={handleSend} className="p-5 border-t border-gray-100 flex gap-3">
                            <label className={`px-4 py-4 rounded-2xl bg-gray-100 text-gray-600 font-black cursor-pointer flex items-center gap-2 ${uploadingImage || !activeId ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={!activeId || uploadingImage} />
                            </label>
                            <input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!activeId || sending} placeholder="Nhập tin nhắn..." className="flex-1 rounded-2xl bg-gray-50 border border-gray-100 px-5 py-4 font-semibold outline-none focus:border-orange-300" />
                            <button disabled={!activeId || sending || !draft.trim()} className="px-6 py-4 rounded-2xl bg-orange-500 text-white font-black disabled:opacity-50 flex items-center gap-2">
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;