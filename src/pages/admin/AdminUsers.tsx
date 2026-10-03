import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Shield, CheckCircle, XCircle, Ban, Trash2, Pencil, Eye, AlertCircle } from 'lucide-react';
import { supabase, type UserProfile } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';

type UserRow = UserProfile & { property_count?: number };

export default function AdminUsers() {
  const { lang } = useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
    if (err) { setError(err.message); setLoading(false); return; }
    const profiles = (data as UserProfile[]) || [];
    // Count properties per user
    const counts = await Promise.all(
      profiles.map(async (p) => {
        const { count } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('created_by', p.id);
        return { ...p, property_count: count || 0 };
      })
    );
    setUsers(counts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateUser = async (id: string, changes: Partial<UserProfile>) => {
    const { error: err } = await supabase.from('user_profiles').update(changes).eq('id', id);
    if (err) { setError(err.message); return; }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...changes } : u)));
    setEditUser(null);
  };

  const deleteUser = async (id: string) => {
    if (!confirm(lang === 'ru' ? 'Удалить пользователя?' : lang === 'en' ? 'Delete user?' : 'Колдонуучуну өчүрөсүзбү?')) return;
    const { error: err } = await supabase.from('user_profiles').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q);
  });

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      agent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      user: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[role] || colors.user;
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all";

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {lang === 'ru' ? 'Пользователи' : lang === 'en' ? 'Users' : 'Колдонуучулар'}
        </h1>
        <p className="text-gray-500 text-sm">
          {lang === 'ru' ? 'Управление пользователями и правами' : lang === 'en' ? 'Manage users and permissions' : 'Колдонуучуларды жана укуктарды башкаруу'}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-xl p-3 border border-red-200 dark:border-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'ru' ? 'Поиск...' : lang === 'en' ? 'Search...' : 'Издөө...'}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">{lang === 'ru' ? 'Нет пользователей' : lang === 'en' ? 'No users' : 'Колдонуучулар жок'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'ru' ? 'ФИО' : lang === 'en' ? 'Name' : 'Аты'}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">{lang === 'ru' ? 'Телефон' : lang === 'en' ? 'Phone' : 'Телефон'}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">{lang === 'ru' ? 'Регистрация' : lang === 'en' ? 'Registered' : 'Катталган'}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'ru' ? 'Роль' : lang === 'en' ? 'Role' : 'Роль'}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">{lang === 'ru' ? 'Объекты' : lang === 'en' ? 'Listings' : 'Объекттер'}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'ru' ? 'Статус' : lang === 'en' ? 'Status' : 'Статус'}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'ru' ? 'Действия' : lang === 'en' ? 'Actions' : 'Аракеттер'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{u.full_name || '—'}</div>
                      <div className="text-xs text-gray-500">{u.email || '—'}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{u.phone || '—'}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{u.property_count || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_blocked ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {lang === 'ru' ? 'Заблокирован' : lang === 'en' ? 'Blocked' : 'Блоктелген'}
                        </span>
                      ) : u.can_publish ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {lang === 'ru' ? 'Активен' : lang === 'en' ? 'Active' : 'Активдүү'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {lang === 'ru' ? 'Без прав' : lang === 'en' ? 'No access' : 'Укуксуз'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditUser(u)}
                          className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          title={lang === 'ru' ? 'Изменить роль' : lang === 'en' ? 'Edit role' : 'Роль өзгөртүү'}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateUser(u.id, { can_publish: !u.can_publish })}
                          className={`p-2 rounded-lg transition-colors ${u.can_publish ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                          title={u.can_publish ? (lang === 'ru' ? 'Запретить публикацию' : lang === 'en' ? 'Revoke publish' : 'Тыюу салуу') : (lang === 'ru' ? 'Разрешить публикацию' : lang === 'en' ? 'Allow publish' : 'Уруксат берүү')}
                        >
                          {u.can_publish ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => updateUser(u.id, { is_blocked: !u.is_blocked })}
                          className={`p-2 rounded-lg transition-colors ${u.is_blocked ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                          title={u.is_blocked ? (lang === 'ru' ? 'Разблокировать' : lang === 'en' ? 'Unblock' : 'Блокту ачуу') : (lang === 'ru' ? 'Заблокировать' : lang === 'en' ? 'Block' : 'Блоктоо')}
                        >
                          {u.is_blocked ? <Shield className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title={lang === 'ru' ? 'Удалить' : lang === 'en' ? 'Delete' : 'Өчүрүү'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit role modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4">
              {lang === 'ru' ? 'Изменить пользователя' : lang === 'en' ? 'Edit user' : 'Колдонуучуну өзгөртүү'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{lang === 'ru' ? 'Имя' : lang === 'en' ? 'Name' : 'Аты'}</label>
                <input type="text" value={editUser.full_name || ''} onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{lang === 'ru' ? 'Роль' : lang === 'en' ? 'Role' : 'Роль'}</label>
                <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value as any })} className={inputClass}>
                  <option value="user">{lang === 'ru' ? 'Пользователь' : lang === 'en' ? 'User' : 'Колдонуучу'}</option>
                  <option value="agent">{lang === 'ru' ? 'Агент' : lang === 'en' ? 'Agent' : 'Агент'}</option>
                  <option value="admin">{lang === 'ru' ? 'Администратор' : lang === 'en' ? 'Administrator' : 'Администратор'}</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditUser({ ...editUser, can_publish: !editUser.can_publish })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editUser.can_publish ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editUser.can_publish ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">{lang === 'ru' ? 'Разрешить публикацию' : lang === 'en' ? 'Can publish' : 'Жариялоого уруксат'}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditUser({ ...editUser, is_blocked: !editUser.is_blocked })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editUser.is_blocked ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editUser.is_blocked ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">{lang === 'ru' ? 'Заблокировать' : lang === 'en' ? 'Blocked' : 'Блоктоо'}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditUser(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                {lang === 'ru' ? 'Отмена' : lang === 'en' ? 'Cancel' : 'Жокко чыгаруу'}
              </button>
              <button onClick={() => updateUser(editUser.id, { full_name: editUser.full_name, role: editUser.role, can_publish: editUser.can_publish, is_blocked: editUser.is_blocked })} className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors">
                {lang === 'ru' ? 'Сохранить' : lang === 'en' ? 'Save' : 'Сактоо'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
