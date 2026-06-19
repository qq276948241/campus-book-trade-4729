import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, BookOpen, ShoppingBag, Star, Settings,
  Edit2, Trash2, Eye, Award, BookMarked, History,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Book, Order, Review } from '@/types';
import { cn } from '@/lib/utils';

type TabType = 'selling' | 'orders' | 'reviews';

export default function Profile() {
  const { user, isLoggedIn, fetchMe } = useAuthStore();
  const [tab, setTab] = useState<TabType>('selling');
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderSubTab, setOrderSubTab] = useState<'buy' | 'sell'>('buy');

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'selling') {
        const res = await api.profile.myBooks();
        setBooks(res.books);
      } else if (tab === 'orders') {
        const [buy, sell] = await Promise.all([
          api.profile.myOrders('buy'),
          api.profile.myOrders('sell'),
        ]);
        setOrders(orderSubTab === 'buy' ? buy.orders : sell.orders);
      } else if (tab === 'reviews') {
        const res = await api.profile.myReviews();
        setReviews(res.reviews);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchMe();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [tab, orderSubTab, isLoggedIn]);

  const handleRemove = async (id: number) => {
    if (!confirm('确定下架这本书吗？')) return;
    try {
      await api.books.remove(id);
      loadData();
      alert('下架成功');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">请先登录</h2>
        <p className="text-ink-soft">登录后查看您的个人中心</p>
      </div>
    );
  }

  const stats = [
    { label: '在售书籍', value: books.length, icon: BookMarked, color: 'text-moss-500', bg: 'bg-moss-50' },
    { label: '成交笔数', value: orders.filter((o) => o.status === 'done').length, icon: Award, color: 'text-ember', bg: 'bg-ember/10' },
    { label: '信用积分', value: user?.creditScore || 0, icon: Star, color: 'text-moss-600', bg: 'bg-moss-100' },
  ];

  return (
    <div className="container py-8 max-w-5xl">
      <div className="bg-gradient-to-br from-moss-500 to-moss-700 rounded-3xl p-8 text-paper-pure mb-6 relative overflow-hidden paper-grain">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-ember/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        <div className="relative flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-paper-pure/20 backdrop-blur flex items-center justify-center text-3xl font-bold border border-paper-pure/30">
            {user?.nickname?.[0] || 'U'}
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-bold">{user?.nickname}</h1>
            <p className="text-paper/70 text-sm mt-1">@{user?.username} · 加入于 {new Date(user?.createdAt || '').toLocaleDateString('zh-CN')}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-xs bg-paper-pure/20 px-2.5 py-1 rounded-full">
                <Star className="w-3 h-3 fill-ember-soft text-ember-soft" />
                信用 {user?.creditScore || 100}
              </span>
              <span className="text-xs text-paper/70">在读学生认证</span>
            </div>
          </div>
          <button className="h-10 px-4 bg-paper-pure/15 hover:bg-paper-pure/25 backdrop-blur rounded-lg text-sm transition-colors flex items-center gap-1.5">
            <Settings className="w-4 h-4" />
            设置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-paper-pure rounded-xl border border-paper-edge p-5 shadow-soft">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>
                <Icon className={cn('w-5 h-5', s.color)} />
              </div>
              <div className="font-serif font-bold text-2xl text-ink">{s.value}</div>
              <div className="text-xs text-ink-soft mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 bg-paper-warm rounded-xl p-1 mb-6">
        {[
          { key: 'selling', label: '在售书籍', icon: BookOpen },
          { key: 'orders', label: '成交记录', icon: ShoppingBag },
          { key: 'reviews', label: '我的评价', icon: Star },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as TabType)}
              className={cn(
                'flex-1 h-10 inline-flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all',
                tab === t.key ? 'bg-paper-pure text-moss-700 shadow-sm' : 'text-ink-soft hover:text-ink',
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'orders' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setOrderSubTab('buy')}
            className={cn(
              'h-8 px-4 text-xs font-medium rounded-full transition-all',
              orderSubTab === 'buy' ? 'bg-moss-500 text-paper-pure' : 'bg-paper-pure text-ink-soft border border-paper-edge',
            )}
          >
            我买入的
          </button>
          <button
            onClick={() => setOrderSubTab('sell')}
            className={cn(
              'h-8 px-4 text-xs font-medium rounded-full transition-all',
              orderSubTab === 'sell' ? 'bg-moss-500 text-paper-pure' : 'bg-paper-pure text-ink-soft border border-paper-edge',
            )}
          >
            我卖出的
          </button>
        </div>
      )}

      <div className="bg-paper-pure rounded-xl border border-paper-edge overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-paper-warm rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tab === 'selling' ? (
          books.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">📖</div>
              <h3 className="font-serif text-lg text-ink mb-1">还没有上架书籍</h3>
              <p className="text-ink-soft text-sm mb-4">让您的闲置书籍流动起来吧</p>
              <Link to="/sell" className="inline-flex items-center gap-1.5 h-10 px-5 bg-moss-500 text-paper-pure rounded-lg text-sm font-medium">
                去上架
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-paper-edge">
              {books.map((book) => (
                <div key={book.id} className="flex items-center gap-4 p-4 hover:bg-paper-warm/50 transition-colors">
                  <div className="w-14 h-20 rounded-lg overflow-hidden bg-paper-warm shrink-0 book-spine">
                    {book.cover && <img src={book.cover.startsWith('http') ? book.cover : `http://localhost:8080${book.cover}`} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-ink truncate">{book.title}</h4>
                    <p className="text-xs text-ink-soft">{book.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-ember">¥{book.price}</span>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full',
                        book.status === 'selling' ? 'bg-moss-100 text-moss-700' : 'bg-ink/10 text-ink-soft',
                      )}>
                        {book.status === 'selling' ? '在售' : '已售出'}
                      </span>
                      {book.tags?.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] text-ink-faint bg-paper-warm px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link to={`/book/${book.id}`} className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-soft hover:bg-paper-warm">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-soft hover:bg-paper-warm">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(book.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-ember/70 hover:bg-ember/10 hover:text-ember"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'orders' ? (
          orders.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-12 h-12 mx-auto mb-3 text-ink-faint" />
              <h3 className="font-serif text-lg text-ink mb-1">暂无{orderSubTab === 'buy' ? '买入' : '卖出'}记录</h3>
              <Link to="/" className="inline-block mt-3 text-moss-500 hover:underline text-sm">去首页逛逛</Link>
            </div>
          ) : (
            <div className="divide-y divide-paper-edge">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 p-4 hover:bg-paper-warm/50">
                  <div className="w-14 h-20 rounded-lg overflow-hidden bg-paper-warm shrink-0">
                    {order.bookCover && <img src={order.bookCover.startsWith('http') ? order.bookCover : `http://localhost:8080${order.bookCover}`} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-ink truncate">{order.bookTitle}</h4>
                    <div className="text-xs text-ink-soft mt-0.5">
                      订单 #{order.id} · {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-ember">¥{order.price}</span>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full',
                        order.status === 'done' ? 'bg-moss-100 text-moss-700' : 'bg-amber-100 text-amber-700',
                      )}>
                        {order.status === 'pending' && '待发货'}
                        {order.status === 'shipped' && '运输中'}
                        {order.status === 'received' && '已签收'}
                        {order.status === 'done' && '已完成'}
                      </span>
                    </div>
                  </div>
                  <Link to={`/orders?orderId=${order.id}`} className="h-9 px-3 inline-flex items-center gap-1 text-xs text-moss-600 bg-moss-50 rounded-lg hover:bg-moss-100">
                    查看详情
                  </Link>
                </div>
              ))}
            </div>
          )
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="w-12 h-12 mx-auto mb-3 text-ink-faint" />
            <h3 className="font-serif text-lg text-ink mb-1">暂无评价</h3>
            <p className="text-ink-soft text-sm">完成交易后可对对方进行评价</p>
          </div>
        ) : (
          <div className="divide-y divide-paper-edge">
            {reviews.map((r) => (
              <div key={r.id} className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-moss-100 flex items-center justify-center text-moss-700 font-bold text-sm">
                    {r.fromUser?.nickname?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink text-sm">{r.fromUser?.nickname}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('w-3.5 h-3.5', i < r.score ? 'fill-ember text-ember' : 'text-ink-faint')} />
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-ink-faint">订单 #{r.orderId} · {new Date(r.createdAt).toLocaleDateString('zh-CN')}</div>
                  </div>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed pl-12">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
