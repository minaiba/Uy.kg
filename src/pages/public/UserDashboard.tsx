import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Save, Home, LogOut, Check, AlertCircle, Heart, MessageSquare, Building2, Plus, Pencil, Trash2, Eye, EyeOff, FileText, Settings, Lock, KeyRound, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { supabase, type Property, type Message } from '@/lib/supabase';
import { t, getTranslatedValue, formatPrice, type CurrencyCode } from '@/lib/i18n';

type Tab = 'listings' | 'add' | 'drafts' | 'favorites' | 'messages' | 'profile';

export default function UserDashboard() {
  const { lang, currency } = useApp();
  const { user, role, canPublish, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('favorites');
  const [profile, setProfile] = useState({ full_name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<Property[]>([]);
  const [drafts, setDrafts] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [convMessages, setConvMessages] = useState<Message[]>([]);
  const [convInput, setConvInput] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('user_profiles').select('full_name, phone, email').eq('id', user.id).maybeSingle();
    if (data) setProfile({ full_name: data.full_name || '', phone: data.phone || '', email: data.email || user.email || '' });
  }, [user]);

  const loadListings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('properties').select('*').eq('created_by', user.id).neq('status', 'draft').order('created_at', { ascending: false });
    setListings((data as Property[]) || []);
  }, [user]);

  const loadDrafts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('properties').select('*').eq('created_by', user.id).eq('status', 'draft').order('created_at', { ascending: false });
    setDrafts((data as Property[]) || []);
  }, [user]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('favorites').select('property_id, properties(*)').eq('user_id', user.id).order('created_at', { ascending: false });
    const props = ((data as any) || []).map((f: any) => f.properties).filter(Boolean) as Property[];
    setFavorites(props);
  }, [user]);

  const loadInquiries = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('property_inquiries').select('*, property:properties(title, main_image_url)').eq('email', user.email).order('created_at', { ascending: false }).limit(20);
    setInquiries(data || []);
  }, [user]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    // Get all messages involving this user, grouped by property + conversation partner
    const { data } = await supabase
      .from('messages')
      .select('*, property:properties(id, title, main_image_url)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    const msgs = (data as any[]) || [];
    // Group by property_id + partner_id to form conversations
    const convMap = new Map<string, any>();
    for (const m of msgs) {
      const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const key = `${m.property_id}_${partnerId}`;
      if (!convMap.has(key)) {
        convMap.set(key, {
          key,
          property_id: m.property_id,
          partner_id: partnerId,
          property: m.property,
          last_message: m.body,
          last_at: m.created_at,
          unread_count: 0,
          messages: [] as Message[],
        });
      }
      const conv = convMap.get(key);
      conv.messages.push(m as Message);
      if (m.receiver_id === user.id && !m.read_at) {
        conv.unread_count++;
      }
    }
    setConversations(Array.from(convMap.values()));
  }, [user]);

  useEffect(() => {
    loadProfile();
    loadListings();
    loadDrafts();
    loadFavorites();
    loadInquiries();
    loadConversations();
  }, [loadProfile, loadListings, loadDrafts, loadFavorites, loadInquiries, loadConversations]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase.from('user_profiles').update({ full_name: profile.full_name, phone: profile.phone }).eq('id', user.id);
    setSaving(false);
    if (updateError) setError(updateError.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleChangePassword = async () => {
    setError(null);
    if (pwForm.next !== pwForm.confirm) {
      setError(lang === 'ru' ? 'Пароли не совпадают' : lang === 'en' ? 'Passwords do not match' : 'Сырсөздөр дал келбейт');
      return;
    }
    if (pwForm.next.length < 6) {
      setError(lang === 'ru' ? 'Пароль должен быть не менее 6 символов' : lang === 'en' ? 'Password must be at least 6 characters' : 'Сырсөз кеминде 6 символ болушу керек');
      return;
    }
    setPwSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setPwSaved(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 3000);
    }
  };

  const togglePublish = async (prop: Property) => {
    const newPublished = !prop.is_published;
    await supabase.from('properties').update({ is_published: newPublished, updated_at: new Date().toISOString() }).eq('id', prop.id);
    loadListings();
  };

  const deleteProperty = async (id: string) => {
    if (!confirm(lang === 'ru' ? 'Удалить объявление?' : lang === 'en' ? 'Delete listing?' : 'Жарнаманы өчүрөсүзбү?')) return;
    await supabase.from('properties').delete().eq('id', id);
    loadListings();
    loadDrafts();
  };

  const removeFavorite = async (propertyId: string) => {
    if (!user) return;
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
    loadFavorites();
  };

  const openConversation = async (conv: any) => {
    setActiveConv(conv);
    setConvMessages(conv.messages.sort((a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    // Mark unread messages as read
    if (user) {
      const unreadIds = conv.messages.filter((m: Message) => m.receiver_id === user.id && !m.read_at).map((m: Message) => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
        loadConversations();
      }
    }
  };

  const sendConvMessage = async () => {
    if (!user || !convInput.trim() || !activeConv) return;
    const { data } = await supabase
      .from('messages')
      .insert({ property_id: activeConv.property_id, sender_id: user.id, receiver_id: activeConv.partner_id, body: convInput.trim() })
      .select('*')
      .single();
    if (data) {
      setConvMessages((prev) => [...prev, data as Message]);
      setConvInput('');
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all";

  const hasPublishAccess = canPublish || role === 'admin';

  const tabs: { key: Tab; icon: any; label: string }[] = [
    ...(hasPublishAccess ? [
      { key: 'listings' as Tab, icon: Building2, label: lang === 'ru' ? 'Мои объявления' : lang === 'en' ? 'My listings' : 'Менин жарнамаларым' },
      { key: 'add' as Tab, icon: Plus, label: lang === 'ru' ? 'Добавить объект' : lang === 'en' ? 'Add property' : 'Объект кошуу' },
      { key: 'drafts' as Tab, icon: FileText, label: lang === 'ru' ? 'Черновики' : lang === 'en' ? 'Drafts' : 'Даректер' },
    ] : []),
    { key: 'favorites', icon: Heart, label: lang === 'ru' ? 'Избранное' : lang === 'en' ? 'Favorites' : 'Тандалмалар' },
    { key: 'messages', icon: MessageSquare, label: lang === 'ru' ? 'Сообщения' : lang === 'en' ? 'Messages' : 'Билдирүүлөр' },
    { key: 'profile', icon: Settings, label: lang === 'ru' ? 'Настройки' : lang === 'en' ? 'Settings' : 'Орнотуулар' },
  ];

  const PropertyRow = ({ p, isDraft }: { p: Property; isDraft?: boolean }) => (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {p.main_image_url ? (
        <img src={p.main_image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{getTranslatedValue(p.title, lang)}</div>
        <div className="text-xs text-gray-500">{p.city || '—'} · {formatPrice(p.price, p.currency as CurrencyCode, currency, lang)}</div>
        <div className="flex items-center gap-2 mt-1">
          {p.moderation_status === 'pending' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {lang === 'ru' ? 'На модерации' : lang === 'en' ? 'Pending' : 'Күтүүдө'}
            </span>
          )}
          {p.moderation_status === 'rejected' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {lang === 'ru' ? 'Отклонено' : lang === 'en' ? 'Rejected' : 'Реджект'}
            </span>
          )}
          {!p.is_published && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {lang === 'ru' ? 'Снято с публикации' : lang === 'en' ? 'Unpublished' : 'Жарияланган жок'}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link to={`/properties/${p.id}`} target="_blank" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Eye className="w-4 h-4" />
        </Link>
        <Link to={`/dashboard/edit/${p.id}`} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
          <Pencil className="w-4 h-4" />
        </Link>
        {!isDraft && (
          <button onClick={() => togglePublish(p)} className={`p-2 rounded-lg transition-colors ${p.is_published ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
            {p.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        <button onClick={() => deleteProperty(p.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-gray-900 dark:text-white">{t(lang, 'auth.myProfile')}</h1>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{t(lang, 'admin.backToSite')}</span>
            </Link>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t(lang, 'auth.signOut')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === tabItem.key
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <tabItem.icon className="w-4 h-4" />
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* My listings */}
        {hasPublishAccess && tab === 'listings' && (
          <div className="space-y-3">
            {listings.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-100 dark:border-gray-800 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400 mb-4">{lang === 'ru' ? 'У вас пока нет объявлений' : lang === 'en' ? 'No listings yet' : 'Жарнамалар жок'}</p>
                <button onClick={() => setTab('add')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all">
                  <Plus className="w-4 h-4" /> {lang === 'ru' ? 'Добавить объект' : lang === 'en' ? 'Add property' : 'Объект кошуу'}
                </button>
              </div>
            ) : (
              listings.map((p) => <PropertyRow key={p.id} p={p} />)
            )}
          </div>
        )}

        {/* Add property */}
        {hasPublishAccess && tab === 'add' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 text-center">
            <>
                <Plus className="w-12 h-12 mx-auto mb-3 text-primary-500" />
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {lang === 'ru' ? 'Добавить новый объект' : lang === 'en' ? 'Add new property' : 'Жаңы объект кошуу'}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {lang === 'ru' ? 'Выберите тип недвижимости' : lang === 'en' ? 'Choose property type' : 'Объект түрүн тандаңыз'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                  {[
                    { type: 'house', label: lang === 'ru' ? 'Дом' : lang === 'en' ? 'House' : 'Үй' },
                    { type: 'apartment', label: lang === 'ru' ? 'Квартира' : lang === 'en' ? 'Apartment' : 'Квартира' },
                    { type: 'land', label: lang === 'ru' ? 'Земельный участок' : lang === 'en' ? 'Land plot' : 'Жер участогу' },
                    { type: 'commercial', label: lang === 'ru' ? 'Коммерческая' : lang === 'en' ? 'Commercial' : 'Коммерциялык' },
                    { type: 'dacha', label: lang === 'ru' ? 'Дача' : lang === 'en' ? 'Dacha' : 'Дача' },
                    { type: 'cottage', label: lang === 'ru' ? 'Коттедж' : lang === 'en' ? 'Cottage' : 'Коттедж' },
                    { type: 'townhouse', label: lang === 'ru' ? 'Таунхаус' : lang === 'en' ? 'Townhouse' : 'Таунхаус' },
                    { type: 'office', label: lang === 'ru' ? 'Офис' : lang === 'en' ? 'Office' : 'Офис' },
                    { type: 'warehouse', label: lang === 'ru' ? 'Склад' : lang === 'en' ? 'Warehouse' : 'Склад' },
                    { type: 'industrial', label: lang === 'ru' ? 'Производство' : lang === 'en' ? 'Industrial' : 'Өндүрүш' },
                  ].map((pt) => (
                    <Link
                      key={pt.type}
                      to={`/dashboard/edit/new?type=${pt.type}`}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
                    >
                      <Building2 className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{pt.label}</span>
                    </Link>
                  ))}
                </div>
            </>
          </div>
        )}

        {/* Drafts */}
        {hasPublishAccess && tab === 'drafts' && (
          <div className="space-y-3">
            {drafts.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-100 dark:border-gray-800 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400">{lang === 'ru' ? 'Черновиков нет' : lang === 'en' ? 'No drafts' : 'Даректер жок'}</p>
              </div>
            ) : (
              drafts.map((p) => <PropertyRow key={p.id} p={p} isDraft />)
            )}
          </div>
        )}

        {/* Favorites */}
        {tab === 'favorites' && (
          <div className="space-y-3">
            {favorites.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-100 dark:border-gray-800 text-center">
                <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400 mb-4">{lang === 'ru' ? 'Избранного нет' : lang === 'en' ? 'No favorites' : 'Тандалмалар жок'}</p>
                <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                  {t(lang, 'nav.properties')}
                </Link>
              </div>
            ) : (
              favorites.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <Link to={`/properties/${p.id}`} className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{getTranslatedValue(p.title, lang)}</div>
                    <div className="text-xs text-gray-500">{p.city || '—'} · {formatPrice(p.price, p.currency as CurrencyCode, currency, lang)}</div>
                  </Link>
                  <button onClick={() => removeFavorite(p.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages */}
        {tab === 'messages' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {activeConv ? (
              <div className="flex flex-col h-[500px]">
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
                  <button onClick={() => { setActiveConv(null); loadConversations(); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {activeConv.property?.main_image_url ? (
                    <img src={activeConv.property.main_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Home className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activeConv.property?.title ? (activeConv.property.title[lang] || activeConv.property.title.ru || '') : '—'}
                    </div>
                    <Link to={`/properties/${activeConv.property_id}`} className="text-xs text-primary-600 hover:underline">
                      {lang === 'ru' ? 'Открыть объявление' : lang === 'en' ? 'View property' : 'Жарнаманы көрүү'}
                    </Link>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {convMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${msg.sender_id === user?.id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
                        {msg.body}
                        <div className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-primary-100' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
                  <input
                    type="text"
                    value={convInput}
                    onChange={(e) => setConvInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendConvMessage(); } }}
                    placeholder={lang === 'ru' ? 'Сообщение...' : lang === 'en' ? 'Message...' : 'Билдирүү...'}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                  <button onClick={sendConvMessage} disabled={!convInput.trim()} className="px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400 text-sm mb-2">{lang === 'ru' ? 'Нет сообщений' : lang === 'en' ? 'No messages' : 'Билдирүүлөр жок'}</p>
                <p className="text-gray-400 text-xs max-w-sm mx-auto">{lang === 'ru' ? 'Откройте объявление и нажмите «Написать сообщение», чтобы начать чат с владельцем.' : lang === 'en' ? 'Open a property and click "Write message" to start a chat with the owner.' : 'Жарнаманы ачып, «Билдирүү жазуу» баскычын басыңыз.'}</p>
                <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline mt-3">
                  {t(lang, 'nav.properties')}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {conversations.map((conv) => (
                  <button
                    key={conv.key}
                    onClick={() => openConversation(conv)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    {conv.property?.main_image_url ? (
                      <img src={conv.property.main_image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Home className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {conv.property?.title ? (conv.property.title[lang] || conv.property.title.ru || '') : '—'}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-400">{new Date(conv.last_at).toLocaleDateString()}</span>
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-600 text-white">{conv.unread_count}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile settings */}
        {tab === 'profile' && (
          <>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-6">
              {lang === 'ru' ? 'Личные данные' : lang === 'en' ? 'Personal info' : 'Жеке маалымат'}
            </h2>
            {saved && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl p-3 border border-green-200 dark:border-green-800 flex items-center gap-2">
                <Check className="w-4 h-4" /> {t(lang, 'admin.saved')}
              </div>
            )}
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl p-3 border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.fullName')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" value={profile.email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {t(lang, 'admin.save')}
              </button>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary-600" />
              {t(lang, 'auth.changePassword')}
            </h2>
            {pwSaved && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl p-3 border border-green-200 dark:border-green-800 flex items-center gap-2">
                <Check className="w-4 h-4" /> {t(lang, 'auth.passwordUpdated')}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.currentPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className={inputClass} placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.newPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className={inputClass} placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className={inputClass} placeholder="••••••••" />
                </div>
              </div>
              <button onClick={handleChangePassword} disabled={pwSaving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20">
                {pwSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {t(lang, 'auth.changePassword')}
              </button>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
