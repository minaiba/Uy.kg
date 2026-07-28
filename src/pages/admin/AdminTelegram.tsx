import { useEffect, useState } from 'react';
import { Send, Users, Trash2, Check, AlertCircle, Link2, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type TelegramSubscriber } from '@/lib/supabase';
import { t } from '@/lib/i18n';

export default function AdminTelegram() {
  const { lang, settings } = useApp();
  const [subscribers, setSubscribers] = useState<TelegramSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcast, setBroadcast] = useState('');
  const [sending, setSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number } | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [settingWebhook, setSettingWebhook] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('telegram_subscribers').select('*').order('subscribed_at', { ascending: false });
    setSubscribers((data as TelegramSubscriber[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendBroadcast = async () => {
    if (!broadcast.trim()) return;
    setSending(true);
    setBroadcastResult(null);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-bot`;
    const response = await fetch(`${apiUrl}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ message: broadcast }),
    });

    if (response.ok) {
      const result = await response.json();
      setBroadcastResult({ sent: result.sent || 0, failed: result.failed || 0 });
      setBroadcast('');
    } else {
      setBroadcastResult({ sent: 0, failed: subscribers.length });
    }
    setSending(false);
  };

  const setupWebhook = async () => {
    setSettingWebhook(true);
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-bot`;
    const response = await fetch(`${apiUrl}/setup-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });
    if (response.ok) {
      const result = await response.json();
      setWebhookStatus(result.message || 'Webhook configured');
    } else {
      setWebhookStatus('Failed to configure webhook');
    }
    setSettingWebhook(false);
  };

  const toggleActive = async (sub: TelegramSubscriber) => {
    await supabase.from('telegram_subscribers').update({ is_active: !sub.is_active }).eq('id', sub.id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'admin.confirmDelete'))) return;
    await supabase.from('telegram_subscribers').delete().eq('id', id);
    load();
  };

  const activeCount = subscribers.filter((s) => s.is_active).length;
  const botLink = settings?.telegram ? `https://t.me/${settings.telegram}` : '';

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6">{t(lang, 'admin.telegram')}</h1>

      {/* Bot info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
              <Send className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{t(lang, 'admin.botStatus')}</div>
              <div className="text-sm text-primary-600 dark:text-primary-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                {t(lang, 'admin.botActive')}
              </div>
            </div>
          </div>
          {botLink && (
            <a href={botLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-sky-500 hover:underline">
              <Link2 className="w-4 h-4" />
              {botLink}
            </a>
          )}
          <button
            onClick={setupWebhook}
            disabled={settingWebhook}
            className="mt-4 w-full px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {settingWebhook ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t(lang, 'admin.setupWebhook')}
          </button>
          {webhookStatus && (
            <div className="mt-2 text-sm text-primary-600 dark:text-primary-400 flex items-center gap-1">
              <Check className="w-4 h-4" />
              {webhookStatus}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{subscribers.length}</div>
              <div className="text-sm text-gray-500">{t(lang, 'admin.totalSubscribers')}</div>
            </div>
          </div>
          <div className="text-sm text-primary-600 dark:text-primary-400 mt-2">
            {activeCount} {t(lang, 'admin.activeSubscribers')}
          </div>
        </div>

        {/* Broadcast */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t(lang, 'admin.broadcast')}</h3>
          <textarea
            value={broadcast}
            onChange={(e) => setBroadcast(e.target.value)}
            placeholder={t(lang, 'admin.broadcastMessage')}
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm mb-3"
          />
          <button
            onClick={sendBroadcast}
            disabled={sending || !broadcast.trim()}
            className="w-full px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            {t(lang, 'admin.sendBroadcast')}
          </button>
          {broadcastResult && (
            <div className={`mt-3 text-sm rounded-lg p-3 ${broadcastResult.failed === 0 ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
              {t(lang, 'admin.broadcastSent')}: {broadcastResult.sent} / {broadcastResult.sent + broadcastResult.failed}
            </div>
          )}
        </div>
      </div>

      {/* Subscribers list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t(lang, 'admin.subscribers')}</h3>
        </div>
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">{t(lang, 'admin.noSubscribers')}</p>
            <p className="text-gray-400 text-sm mt-2">{t(lang, 'admin.subscribeBot')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(lang, 'admin.status')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{sub.chat_id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{sub.username ? `@${sub.username}` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">{sub.first_name || ''} {sub.last_name || ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{new Date(sub.subscribed_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(sub)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          sub.is_active
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {sub.is_active ? t(lang, 'admin.botActive') : t(lang, 'admin.botInactive')}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(sub.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
