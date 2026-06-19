import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Package, Truck, CheckCircle, Star, Clock,
  ChevronRight, Send, MapPin,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Order, OrderDetail } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_STEPS = [
  { key: 'pending', label: '待发货', icon: Clock },
  { key: 'shipped', label: '已发货', icon: Truck },
  { key: 'received', label: '已签收', icon: Package },
  { key: 'done', label: '已完成', icon: Star },
];

const statusLabel: Record<string, { text: string; color: string }> = {
  pending: { text: '待发货', color: 'bg-amber-100 text-amber-700' },
  shipped: { text: '运输中', color: 'bg-blue-100 text-blue-700' },
  received: { text: '已签收', color: 'bg-moss-100 text-moss-700' },
  done: { text: '已完成', color: 'bg-moss-100 text-moss-700' },
};

export default function Orders() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [tab, setTab] = useState<'all' | 'buy' | 'sell'>('all');
  const [loading, setLoading] = useState(true);
  const [logisticsNo, setLogisticsNo] = useState('');
  const [showShip, setShowShip] = useState<number | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewContent, setReviewContent] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.orders.list();
      setOrders(res.orders);
      const preselectId = searchParams.get('orderId');
      if (preselectId) {
        const found = res.orders.find((o) => o.id === Number(preselectId));
        if (found) {
          const detail = await api.orders.detail(Number(preselectId));
          setSelected(detail);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchOrders();
  }, [isLoggedIn, searchParams]);

  const filtered = orders.filter((o) => {
    if (tab === 'buy') return o.buyerId === user?.id;
    if (tab === 'sell') return o.sellerId === user?.id;
    return true;
  });

  const handleSelect = async (order: Order) => {
    const detail = await api.orders.detail(order.id);
    setSelected(detail);
  };

  const handleShip = async (orderId: number) => {
    if (!logisticsNo.trim()) {
      alert('请输入物流单号');
      return;
    }
    try {
      await api.orders.ship(orderId, logisticsNo.trim());
      setShowShip(null);
      setLogisticsNo('');
      fetchOrders();
      alert('发货成功！');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '发货失败');
    }
  };

  const handleConfirm = async (orderId: number) => {
    if (!confirm('确认已收到书籍？')) return;
    try {
      await api.orders.confirm(orderId);
      fetchOrders();
      setReviewOrderId(orderId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleReview = async () => {
    if (!reviewOrderId || !selected) return;
    if (!reviewContent.trim()) {
      alert('请填写评价内容');
      return;
    }
    try {
      await api.reviews.create(reviewOrderId, selected.bookId, reviewScore, reviewContent.trim());
      setReviewOrderId(null);
      setReviewContent('');
      setReviewScore(5);
      fetchOrders();
      alert('评价成功！');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '评价失败');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">请先登录</h2>
        <p className="text-ink-soft">登录后查看您的订单</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="font-serif text-3xl font-bold text-ink mb-6">我的订单</h1>

      <div className="flex gap-2 mb-6">
        {[{ key: 'all', label: '全部' }, { key: 'buy', label: '我买入' }, { key: 'sell', label: '我卖出' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              'h-9 px-4 rounded-full text-sm font-medium transition-all',
              tab === t.key ? 'bg-moss-500 text-paper-pure' : 'bg-paper-pure text-ink-soft hover:bg-paper-warm border border-paper-edge',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-paper-pure rounded-xl border border-paper-edge p-4 animate-pulse">
                <div className="h-20 bg-paper-warm rounded" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="bg-paper-pure rounded-xl border border-paper-edge p-8 text-center">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-ink-soft text-sm">暂无订单</p>
              <Link to="/" className="inline-block mt-3 text-moss-500 hover:underline text-sm">去挑几本书 →</Link>
            </div>
          ) : (
            filtered.map((order) => (
              <button
                key={order.id}
                onClick={() => handleSelect(order)}
                className={cn(
                  'w-full bg-paper-pure rounded-xl border p-4 text-left transition-all',
                  selected?.id === order.id ? 'border-moss-400 shadow-book' : 'border-paper-edge hover:border-moss-200',
                )}
              >
                <div className="flex gap-3">
                  <div className="w-16 h-20 rounded-md bg-paper-warm overflow-hidden shrink-0">
                    {order.bookCover && (
                      <img src={order.bookCover.startsWith('http') ? order.bookCover : `http://localhost:8080${order.bookCover}`} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif font-bold text-ink line-clamp-1 text-sm">{order.bookTitle}</h3>
                      <span className={cn('shrink-0 text-[10px] px-2 py-0.5 rounded-full', statusLabel[order.status].color)}>
                        {statusLabel[order.status].text}
                      </span>
                    </div>
                    <div className="font-bold text-ember text-sm mt-1">¥{order.price}</div>
                    <div className="text-[11px] text-ink-faint mt-1">
                      订单 #{order.id} · {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-paper-pure rounded-xl border border-paper-edge p-6 shadow-soft">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-ink">{selected.bookTitle}</h2>
                  <p className="text-ink-soft text-sm mt-1">订单 #{selected.id}</p>
                </div>
                <span className={cn('text-xs px-3 py-1 rounded-full', statusLabel[selected.status].color)}>
                  {statusLabel[selected.status].text}
                </span>
              </div>

              <div className="relative py-6 mb-6 bg-paper-warm/50 rounded-xl px-6">
                <div className="flex justify-between items-start relative">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = STATUS_STEPS.findIndex((s) => s.key === selected.status);
                    const isActive = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="relative flex flex-col items-center z-10 w-20">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                          isActive ? 'bg-moss-500 text-paper-pure' : 'bg-paper-edge text-ink-faint',
                          isCurrent && 'animate-pulse-node',
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className={cn('text-xs font-medium mt-2 text-center', isActive ? 'text-ink' : 'text-ink-faint')}>
                          {step.label}
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className={cn(
                            'absolute top-5 left-[calc(50%+20px)] h-[2px] w-[calc(100%-40px)]',
                            isActive && idx < currentIdx ? 'bg-moss-500' : 'bg-paper-edge',
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selected.logisticsNo && (
                <div className="mb-6">
                  <h3 className="font-serif font-bold text-ink mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-moss-500" />
                    物流信息 · 单号 {selected.logisticsNo}
                  </h3>
                  <div className="border border-paper-edge rounded-xl overflow-hidden">
                    {selected.logistics?.length === 0 ? (
                      <div className="p-4 text-center text-ink-soft text-sm">暂无物流轨迹</div>
                    ) : (
                      selected.logistics?.map((item, idx) => (
                        <div key={idx} className={cn(
                          'flex gap-4 p-4 relative',
                          idx !== selected.logistics.length - 1 && 'border-b border-paper-edge',
                          idx === 0 && 'bg-moss-50/50',
                        )}>
                          <div className="relative shrink-0">
                            <div className={cn(
                              'w-3 h-3 rounded-full mt-1.5',
                              idx === 0 ? 'bg-moss-500' : 'bg-paper-edge',
                            )} />
                            {idx !== selected.logistics.length - 1 && (
                              <div className="absolute top-4.5 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-paper-edge" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm', idx === 0 ? 'text-ink font-medium' : 'text-ink-soft')}>{item.desc}</p>
                            <div className="flex items-center gap-2 text-xs text-ink-faint mt-1">
                              <MapPin className="w-3 h-3" />
                              {item.location}
                              <span className="ml-auto">{item.time}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {selected.status === 'pending' && selected.sellerId === user?.id && (
                  <button
                    onClick={() => setShowShip(selected.id)}
                    className="flex-1 h-11 bg-moss-500 hover:bg-moss-600 text-paper-pure rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> 立即发货
                  </button>
                )}
                {selected.status === 'shipped' && selected.buyerId === user?.id && (
                  <button
                    onClick={() => handleConfirm(selected.id)}
                    className="flex-1 h-11 bg-moss-500 hover:bg-moss-600 text-paper-pure rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> 确认收货
                  </button>
                )}
                {selected.status === 'received' && !reviewOrderId && (
                  <button
                    onClick={() => setReviewOrderId(selected.id)}
                    className="flex-1 h-11 bg-moss-500 hover:bg-moss-600 text-paper-pure rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4" /> 评价交易
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className="h-11 px-6 border border-paper-edge text-ink rounded-lg hover:bg-paper-warm"
                >
                  继续逛逛
                </button>
              </div>

              {showShip === selected.id && (
                <div className="mt-4 p-4 bg-paper-warm rounded-xl animate-slide-in">
                  <h4 className="font-medium text-ink mb-2">填写物流单号</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={logisticsNo}
                      onChange={(e) => setLogisticsNo(e.target.value)}
                      placeholder="输入快递单号"
                      className="flex-1 h-10 px-3 bg-paper-pure border border-paper-edge rounded-lg"
                    />
                    <button onClick={() => handleShip(selected.id)} className="h-10 px-4 bg-moss-500 text-paper-pure rounded-lg">
                      确认发货
                    </button>
                    <button onClick={() => setShowShip(null)} className="h-10 px-4 border border-paper-edge text-ink rounded-lg">
                      取消
                    </button>
                  </div>
                </div>
              )}

              {reviewOrderId === selected.id && (
                <div className="mt-4 p-4 bg-paper-warm rounded-xl animate-slide-in">
                  <h4 className="font-medium text-ink mb-2">评价本次交易</h4>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewScore(s)}
                        className="focus:outline-none"
                      >
                        <Star className={cn('w-6 h-6 transition-colors', s <= reviewScore ? 'fill-ember text-ember' : 'text-ink-faint')} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="分享您的交易体验..."
                    rows={2}
                    className="w-full px-3 py-2 bg-paper-pure border border-paper-edge rounded-lg resize-none mb-3 text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setReviewOrderId(null)} className="h-9 px-4 border border-paper-edge text-ink rounded-lg text-sm">
                      取消
                    </button>
                    <button onClick={handleReview} className="h-9 px-4 bg-moss-500 text-paper-pure rounded-lg text-sm">
                      提交评价
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-paper-pure rounded-xl border border-paper-edge p-12 text-center">
              <div className="text-5xl mb-3">📋</div>
              <h3 className="font-serif text-xl text-ink mb-1">选择一个订单查看详情</h3>
              <p className="text-ink-soft text-sm">从左侧列表点击订单可查看物流、操作发货、确认收货或评价</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
