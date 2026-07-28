import { useEffect, useState } from 'react';
import { Trash2, Phone, Mail, Inbox, Building2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type PropertyInquiry, type Property } from '@/lib/supabase';
import { t, getTranslatedValue } from '@/lib/i18n';

export default function AdminInquiries() {
  const { lang } = useApp();
  const [inquiries, setInquiries] = useState<(PropertyInquiry & { properties: Property | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('property_inquiries')
      .select('*, properties(title, city)')
      .order('created_at', { ascending: false });
    setInquiries((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'admin.confirmDelete'))) return;
    await supabase.from('property_inquiries').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6">{t(lang, 'admin.inquiries')}</h1>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">{t(lang, 'admin.noInquiries')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {inquiries.map((inq) => (
              <div key={inq.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">
                          {inq.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{inq.name}</div>
                        <div className="text-xs text-gray-400">{new Date(inq.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                      <a href={`tel:${inq.phone}`} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <Phone className="w-4 h-4" /> {inq.phone}
                      </a>
                      {inq.email && (
                        <a href={`mailto:${inq.email}`} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                          <Mail className="w-4 h-4" /> {inq.email}
                        </a>
                      )}
                    </div>
                    {inq.properties && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <Building2 className="w-4 h-4" />
                        {getTranslatedValue(inq.properties.title, lang)}
                      </div>
                    )}
                    {inq.message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        {inq.message}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleDelete(inq.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
