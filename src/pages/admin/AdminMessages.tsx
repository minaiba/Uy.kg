import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Search, ArrowLeft, Send, Home } from 'lucide-react';
import { supabase, type Message } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { getTranslatedValue } from '@/lib/i18n';

export default function AdminMessages() {
  const { lang } = useApp();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [convMessages, setConvMessages] = useState<Message[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAdminId(data.session?.user?.id ?? null);
    });
  }, []);

  const load = useCallback(async () => {
    if (!adminId) { setLoading(false); return; }
    setLoading(true);
    // Only messages where the admin is sender or receiver — NOT all user conversations
    const { data } = await supabase
      .from('messages')
      .select('*, property:properties(id, title, main_image_url), sender:sender_id(full_name, email), receiver:receiver_id(full_name, email)')
      .or(`sender_id.eq.${adminId},receiver_id.eq.${adminId}`)
      .order('created_at', { ascending: false });
    const msgs = (data as any[]) || [];
    const convMap = new Map<string, any>();
    for (const m of msgs) {
      const partnerId = m.sender_id === adminId ? m.receiver_id : m.sender_id;
      const key = `${m.property_id}_${partnerId}`;
      if (!convMap.has(key)) {
        const partner = m.sender_id === adminId
          ? (m.receiver?.full_name || m.receiver?.email || 'Unknown')
          : (m.sender?.full_name || m.sender?.email || 'Unknown');
        convMap.set(key, {
          key,
          property_id: m.property_id,
          property: m.property,
          partner_id: partnerId,
          partner_name: partner,
          last_message: m.body,
          last_at: m.created_at,
          messages: [] as Message[],
        });
      }
      convMap.get(key).messages.push(m as Message);
    }
    setConversations(Array.from(convMap.values()));
    setLoading(false);
  }, [adminId]);

  useEffect(() => { load(); }, [load]);

  const openConv = (conv: any) => {
    setActiveConv(conv);
    const sorted = [...conv.messages].sort((a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setConvMessages(sorted);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendReply = async () => {
    if (!replyInput.trim() || !activeConv) return;
    // Admin replies as the receiver of the original conversation (i.e. to the property owner)
    // Actually admin should reply to whoever messaged. We reply to the sender of the last incoming message.
    // The admin sends as themselves to the other party.
    if (!adminId) return;
    const targetId = activeConv.partner_id;
    const { data } = await supabase
      .from('messages')
      .insert({ property_id: activeConv.property_id, sender_id: adminId, receiver_id: targetId, body: replyInput.trim() })
      .select('*')
      .single();
    if (data) {
      setConvMessages((prev) => [...prev, data as Message]);
      setReplyInput('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const title = c.property?.title ? getTranslatedValue(c.property.title, lang) : '';
    return (c.partner_name || '').toLowerCase().includes(search.toLowerCase()) || title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {lang === 'ru' ? 'Сообщения' : lang === 'en' ? 'Messages' : 'Билдирүүлөр'}
        </h1>
        <p className="text-gray-500 text-sm">
          {lang === 'ru' ? 'Ваши чаты' : lang === 'en' ? 'Your chats' : 'Сиздин чаттарыңыз'}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex h-[600px]">
        {/* Left: conversation list */}
        <div className={`${activeConv ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-gray-200 dark:border-gray-800 flex-shrink-0`}>
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ru' ? 'Поиск...' : lang === 'en' ? 'Search...' : 'Издөө...'}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400 text-sm">{lang === 'ru' ? 'Нет чатов' : lang === 'en' ? 'No chats' : 'Чаттар жок'}</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.key}
                  onClick={() => openConv(conv)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left border-b border-gray-50 dark:border-gray-800/50 ${activeConv?.key === conv.key ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    {conv.property?.main_image_url ? (
                      <img src={conv.property.main_image_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <Home className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{conv.partner_name}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.property?.title ? getTranslatedValue(conv.property.title, lang) : '—'}
                    </div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{conv.last_message}</div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{new Date(conv.last_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: active conversation */}
        {activeConv ? (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button onClick={() => setActiveConv(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden">
                <ArrowLeft className="w-5 h-5" />
              </button>
              {activeConv.property?.main_image_url ? (
                <img src={activeConv.property.main_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activeConv.partner_name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {activeConv.property?.title ? getTranslatedValue(activeConv.property.title, lang) : '—'}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/50 dark:bg-gray-950/30">
              {convMessages.map((msg) => {
                const isAdmin = msg.sender_id === adminId;
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isAdmin ? 'bg-primary-600 text-white rounded-br-md' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700'}`}>
                      {msg.body}
                      <div className={`text-xs mt-1 ${isAdmin ? 'text-primary-100' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2 bg-white dark:bg-gray-900">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder={lang === 'ru' ? 'Ответить...' : lang === 'en' ? 'Reply...' : 'Жооп...'}
                className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <button onClick={sendReply} disabled={!replyInput.trim()} className="w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50/50 dark:bg-gray-950/30">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
              <p className="text-gray-400 text-sm">{lang === 'ru' ? 'Выберите чат слева' : lang === 'en' ? 'Select a chat on the left' : 'Солдон чатты тандаңыз'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
