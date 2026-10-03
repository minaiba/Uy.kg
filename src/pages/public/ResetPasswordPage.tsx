import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Mail, Lock, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

export default function ResetPasswordPage() {
  const { lang } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hasToken = !!searchParams.get('type') || !!searchParams.get('access_token') || !!searchParams.get('code');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If Supabase redirected here with a recovery token, the session is already set
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && (searchParams.get('type') === 'recovery' || searchParams.get('code'))) {
        // Valid recovery session — stay on page to set new password
      }
    });
  }, [searchParams]);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const redirectTo = `${window.location.origin}/reset-password?type=recovery`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setSubmitting(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess(t(lang, 'auth.resetLinkSent'));
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError(lang === 'ru' ? 'Пароли не совпадают' : lang === 'en' ? 'Passwords do not match' : 'Сырсөздөр дал келбейт');
      return;
    }
    if (newPassword.length < 6) {
      setError(lang === 'ru' ? 'Пароль должен быть не менее 6 символов' : lang === 'en' ? 'Password must be at least 6 characters' : 'Сырсөз кеминде 6 символ болушу керек');
      return;
    }

    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(t(lang, 'auth.passwordChanged'));
      await supabase.auth.signOut();
      setTimeout(() => navigate('/auth'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-primary-50 to-gray-100 dark:from-gray-950 dark:via-primary-950/30 dark:to-gray-950 px-4 py-12">
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t(lang, 'admin.backToSite')}
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
              {t(lang, 'auth.resetPassword')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {hasToken ? t(lang, 'auth.setNewPasswordDesc') : t(lang, 'auth.resetPasswordDesc')}
            </p>
          </div>

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl p-3 border border-green-200 dark:border-green-800 mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl p-3 border border-red-200 dark:border-red-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {hasToken ? (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.newPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t(lang, 'auth.setNewPassword')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t(lang, 'auth.sendResetLink')}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <Link to="/auth" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
              {t(lang, 'auth.haveAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
