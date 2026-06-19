import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        if (!nickname.trim()) {
          setError('请输入昵称');
          setLoading(false);
          return;
        }
        await register(username, password, nickname);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-paper-pure rounded-2xl shadow-book-hover overflow-hidden animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-ink-soft hover:bg-paper-warm transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-moss-50 mb-3">
              <svg className="w-8 h-8 text-moss-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-ink">
              {mode === 'login' ? '欢迎回到书窝' : '加入书窝'}
            </h2>
            <p className="text-sm text-ink-soft mt-1">
              {mode === 'login' ? '登录后开始买卖书' : '注册账号，开启校园书香之旅'}
            </p>
          </div>

          <div className="flex p-1 bg-paper-warm rounded-lg mb-6">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                mode === 'login' ? 'bg-paper-pure text-moss-700 shadow-sm' : 'text-ink-soft',
              )}
            >
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                mode === 'register' ? 'bg-paper-pure text-moss-700 shadow-sm' : 'text-ink-soft',
              )}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="例如：书虫小明"
                  className="w-full h-11 px-4 bg-paper border border-paper-edge rounded-lg focus:outline-none focus:border-moss-400 focus:ring-2 focus:ring-moss-100 transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">账号（学号/手机号）</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入您的学号或手机号"
                className="w-full h-11 px-4 bg-paper border border-paper-edge rounded-lg focus:outline-none focus:border-moss-400 focus:ring-2 focus:ring-moss-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="w-full h-11 px-4 bg-paper border border-paper-edge rounded-lg focus:outline-none focus:border-moss-400 focus:ring-2 focus:ring-moss-100 transition-all"
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-ember/10 border border-ember/30 rounded-lg text-ember text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-moss-500 hover:bg-moss-600 disabled:bg-moss-300 text-paper-pure rounded-lg font-medium transition-all shadow-soft"
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-paper-edge text-center text-xs text-ink-faint">
            测试账号：buyer / 123456（买家）· seller / 123456（卖家）
          </div>
        </div>
      </div>
    </div>
  );
}
