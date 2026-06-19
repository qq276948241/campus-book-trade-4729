import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, PlusCircle, MessageSquare, User,
  LogIn, LogOut, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import AuthModal from '@/components/AuthModal';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('keyword') || '');
  }, [location.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.pathname !== '/') navigate('/');
    const params = new URLSearchParams(location.search);
    if (search.trim()) params.set('keyword', search.trim());
    else params.delete('keyword');
    navigate({ pathname: '/', search: params.toString() });
  };

  const handleSell = () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    navigate('/sell');
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-paper/80 border-b border-paper-edge">
      <div className="container">
        <div className="flex items-center gap-4 h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="relative">
              <BookOpen className="w-7 h-7 text-moss-600" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-ember rounded-full animate-pulse" />
            </div>
            <span className="font-serif font-bold text-xl text-moss-700 group-hover:text-moss-800 transition-colors">
              书窝
            </span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-md ml-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索书名、作者或关键词..."
                className="w-full h-10 pl-9 pr-4 text-sm bg-paper-pure border border-paper-edge rounded-full focus:outline-none focus:border-moss-400 focus:ring-2 focus:ring-moss-100 transition-all"
              />
            </div>
          </form>

          <nav className="flex items-center gap-1 ml-auto">
            <button
              onClick={handleSell}
              className="inline-flex items-center gap-1.5 h-10 px-5 bg-moss-500 hover:bg-moss-600 text-paper-pure rounded-lg font-medium text-sm transition-all shadow-soft hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">上架卖书</span>
            </button>

            <Link
              to="/messages"
              className={cn(
                'relative inline-flex items-center justify-center w-10 h-10 rounded-lg transition-all',
                location.pathname === '/messages' ? 'bg-moss-100 text-moss-700' : 'text-ink-soft hover:bg-paper-warm text-ink',
              )}
            >
              <MessageSquare className="w-5 h-5" />
            </Link>

            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg hover:bg-paper-warm transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-moss-100 flex items-center justify-center text-moss-700 font-bold text-sm border border-moss-200">
                    {user?.nickname?.[0] || 'U'}
                  </div>
                  <ChevronDown className={cn('w-4 h-4 text-ink-soft transition-transform', menuOpen && 'rotate-180')} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-paper-pure rounded-lg shadow-book-hover border border-paper-edge overflow-hidden z-20 animate-slide-in">
                      <Link
                        to="/orders"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-moss-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        我的订单
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-moss-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User className="w-4 h-4" /> 个人中心
                      </Link>
                      <div className="border-t border-paper-edge" />
                      <button
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ember hover:bg-paper-warm"
                      >
                        <LogOut className="w-4 h-4" /> 退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="inline-flex items-center gap-1.5 h-10 px-4 border border-moss-300 text-moss-700 rounded-lg font-medium text-sm hover:bg-moss-50 transition-all"
              >
                <LogIn className="w-4 h-4" />
                登录
              </button>
            )}
          </nav>
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  );
}
