import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, MessageCircle, User, Calendar, Tag,
  Package, CheckCircle, Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import AuthModal from '@/components/AuthModal';
import type { BookDetail } from '@/types';
import { cn } from '@/lib/utils';



export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.books.detail(Number(id)).then((res) => {
      setBook(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    if (!book) return;
    if (user?.id === book.sellerId) {
      alert('不能购买自己的书籍');
      return;
    }
    if (!confirm(`确定以 ¥${book.price} 购买《${book.title}》吗？`)) return;
    setOrdering(true);
    try {
      const res = await api.orders.create(book.id);
      alert('下单成功！');
      navigate(`/orders?orderId=${res.order.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '下单失败');
    } finally {
      setOrdering(false);
    }
  };

  const handleChat = async () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    if (!book) return;
    try {
      const res = await api.messages.createConversation(book.sellerId, book.id);
      navigate(`/messages?conversationId=${res.conversation.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '创建会话失败');
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="aspect-[3/4] bg-paper-warm rounded-xl" />
          <div className="md:col-span-2 space-y-4">
            <div className="h-10 bg-paper-warm rounded w-3/4" />
            <div className="h-5 bg-paper-warm rounded w-1/2" />
            <div className="h-20 bg-paper-warm rounded" />
            <div className="h-60 bg-paper-warm rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container py-20 text-center">
        <div className="text-6xl mb-3">📕</div>
        <h2 className="font-serif text-xl text-ink mb-1">书籍不存在</h2>
        <button onClick={() => navigate('/')} className="text-moss-500 hover:underline">返回首页</button>
      </div>
    );
  }

  const coverUrl = book.cover?.startsWith('http') || book.cover?.startsWith('/uploads')
    ? book.cover
    : `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`${book.title} book cover by ${book.author}, literary, minimalist, paper texture`)}&image_size=portrait_4_3`;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="relative">
          <div className="sticky top-24">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-book-hover book-spine bg-paper-warm">
              <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
              {book.status === 'sold' && (
                <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                  <span className="bg-ember text-paper-pure px-4 py-2 rounded-full font-bold rotate-[-8deg]">
                    已售出
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 bg-paper-pure rounded-xl border border-paper-edge p-4 shadow-soft">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-ink-soft">售价</span>
                <span className="font-serif font-bold text-3xl text-ember">¥{book.price}</span>
              </div>
              <div className="text-xs text-ink-soft mt-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                包邮 · 48 小时内发货
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {book.tags?.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-xs bg-moss-50 text-moss-700 px-2.5 py-1 rounded-full">
                  <Tag className="w-3 h-3" />
                  {t}
                </span>
              ))}
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink leading-tight">{book.title}</h1>
            <p className="text-ink-soft mt-2 text-lg">作者：{book.author}</p>
            {book.isbn && <p className="text-xs text-ink-faint mt-1">ISBN: {book.isbn}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-paper-pure rounded-xl border border-paper-edge p-4 text-center">
              <div className="font-serif font-bold text-xl text-moss-600">{book.condition}</div>
              <div className="text-xs text-ink-soft mt-1">书籍成色</div>
            </div>
            <div className="bg-paper-pure rounded-xl border border-paper-edge p-4 text-center">
              <div className="font-serif font-bold text-xl text-ember">¥{book.price}</div>
              <div className="text-xs text-ink-soft mt-1">定价</div>
            </div>
            <div className="bg-paper-pure rounded-xl border border-paper-edge p-4 text-center">
              <div className="font-serif font-bold text-xl text-moss-700 flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-moss-500 text-moss-500" />
                {book.seller?.creditScore || 100}
              </div>
              <div className="text-xs text-ink-soft mt-1">卖家信用</div>
            </div>
          </div>

          <div className="bg-paper-pure rounded-xl border border-paper-edge p-5 shadow-soft">
            <h3 className="font-serif font-bold text-ink mb-3">书籍简介</h3>
            <p className="text-ink-soft leading-relaxed">
              {book.description || '卖家暂未填写书籍简介，您可以私聊询问更多详情。'}
            </p>
          </div>

          <div className="bg-paper-pure rounded-xl border border-paper-edge p-5 shadow-soft">
            <h3 className="font-serif font-bold text-ink mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-moss-500" />
              卖家信息
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-moss-100 flex items-center justify-center text-moss-700 font-bold text-xl border border-moss-200">
                {book.seller?.nickname?.[0] || 'S'}
              </div>
              <div className="flex-1">
                <div className="font-bold text-ink">{book.seller?.nickname || '书窝用户'}</div>
                <div className="flex items-center gap-4 text-xs text-ink-soft mt-1">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-ember text-ember" />
                    信用 {book.seller?.creditScore || 100}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    加入于 {new Date(book.seller?.createdAt || '').toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-4 left-0 right-0 z-30 bg-paper-pure/95 backdrop-blur border border-paper-edge rounded-2xl p-4 shadow-book-hover">
            <div className="flex gap-3">
              <button
                onClick={handleChat}
                className="flex-1 h-12 flex items-center justify-center gap-2 border-2 border-moss-500 text-moss-600 rounded-xl font-bold hover:bg-moss-50 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                私聊砍价
              </button>
              <button
                onClick={handleBuy}
                disabled={book.status === 'sold' || ordering || user?.id === book.sellerId}
                className={cn(
                  'flex-[1.5] h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-paper-pure transition-all',
                  book.status === 'sold' || user?.id === book.sellerId
                    ? 'bg-ink-faint cursor-not-allowed'
                    : 'bg-moss-500 hover:bg-moss-600 active:scale-[0.98] shadow-soft',
                )}
              >
                <ShoppingCart className="w-5 h-5" />
                {book.status === 'sold' ? '已售出' : user?.id === book.sellerId ? '您的书籍' : ordering ? '下单中...' : '立即下单'}
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
