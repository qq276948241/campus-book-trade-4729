import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageCircle, Send, Coins, Image, X, Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Conversation, Message } from '@/types';
import { cn } from '@/lib/utils';

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [convId, setConvId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [offerMode, setOfferMode] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.messages.conversations();
      setConversations(res.conversations);
    } catch { /* empty */ }
  };

  const fetchMessages = async (id: number) => {
    try {
      const res = await api.messages.list(id);
      setMessages(res.messages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch { /* empty */ }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchConversations();
    const initial = searchParams.get('conversationId');
    if (initial) setConvId(Number(initial));
  }, [isLoggedIn]);

  useEffect(() => {
    if (convId) {
      fetchMessages(convId);
      setSearchParams({ conversationId: String(convId) }, { replace: true });
      const interval = setInterval(() => fetchMessages(convId), 2000);
      return () => clearInterval(interval);
    }
  }, [convId]);

  const handleSend = async () => {
    if (!convId || !currentConv || (!input.trim() && !offerMode)) return;
    const receiverId = currentConv.peerUser.id;
    setSending(true);
    try {
      if (offerMode && offerPrice) {
        await api.messages.send(convId, receiverId, `出价 ¥${offerPrice}`, 'offer');
        setOfferMode(false);
        setOfferPrice('');
      } else if (input.trim()) {
        await api.messages.send(convId, receiverId, input.trim(), 'text');
        setInput('');
      }
      fetchMessages(convId);
      fetchConversations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '发送失败');
    } finally {
      setSending(false);
    }
  };

  const currentConv = conversations.find((c) => c.id === convId);

  if (!isLoggedIn) {
    return (
      <div className="container py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">请先登录</h2>
        <p className="text-ink-soft">登录后查看消息</p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="font-serif text-3xl font-bold text-ink mb-6">消息中心</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-0 bg-paper-pure rounded-2xl border border-paper-edge overflow-hidden h-[calc(100vh-180px)] min-h-[500px]">
        <div className="border-r border-paper-edge flex flex-col">
          <div className="p-4 border-b border-paper-edge">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                type="text"
                placeholder="搜索会话..."
                className="w-full h-9 pl-9 pr-3 bg-paper border border-paper-edge rounded-lg text-sm focus:outline-none focus:border-moss-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-ink-soft text-sm">暂无消息</div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setConvId(conv.id)}
                  className={cn(
                    'w-full p-4 text-left border-b border-paper-edge hover:bg-moss-50/50 transition-colors',
                    conv.id === convId && 'bg-moss-50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-moss-100 flex items-center justify-center text-moss-700 font-bold border border-moss-200">
                        {conv.peerUser?.nickname?.[0] || 'U'}
                      </div>
                      {conv.unread > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-ember text-paper-pure text-[10px] rounded-full flex items-center justify-center font-bold">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-ink text-sm truncate">{conv.peerUser?.nickname}</span>
                        <span className="text-[10px] text-ink-faint shrink-0">
                          {new Date(conv.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-ink-soft truncate mt-0.5">{conv.lastMessage || '暂无消息'}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {currentConv ? (
            <>
              <div className="h-14 px-5 flex items-center justify-between border-b border-paper-edge bg-paper-warm/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-moss-100 flex items-center justify-center text-moss-700 font-bold text-sm border border-moss-200">
                    {currentConv.peerUser?.nickname?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-ink text-sm">{currentConv.peerUser?.nickname}</div>
                    <div className="text-[10px] text-ink-soft">信用 {currentConv.peerUser?.creditScore || 100}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-ink-soft text-xs">
                  <MessageCircle className="w-3.5 h-3.5" />
                  私聊中
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-paper to-paper-warm/30">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-ink-soft">
                    <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">开始和卖家聊聊吧</p>
                    <p className="text-xs mt-1">可以先礼貌问好书况再出价 🌿</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const mine = msg.fromUserId === user?.id;
                    const isOffer = msg.type === 'offer';
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                        style={{ animation: `float-up 0.4s ease ${idx * 30}ms both` }}
                      >
                        <div className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2.5 relative',
                          mine
                            ? 'bg-moss-500 text-paper-pure rounded-tr-none'
                            : 'bg-paper-pure text-ink rounded-tl-none border border-paper-edge shadow-soft',
                          isOffer && !mine && 'border-dashed border-ember/50 bg-ember/5',
                        )}>
                          {isOffer ? (
                            <div className="flex items-center gap-2">
                              <Coins className="w-4 h-4" />
                              <span className="font-bold">{msg.content}</span>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          )}
                          <div className={cn('text-[10px] mt-1 opacity-60 text-right')}>
                            {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {offerMode && (
                <div className="px-4 py-2 bg-ember/5 border-t border-ember/20 flex items-center gap-2 animate-slide-in">
                  <Coins className="w-4 h-4 text-ember" />
                  <span className="text-sm text-ember">您正在出价</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-ember">¥</span>
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="输入价格"
                      className="w-24 h-8 px-2 bg-paper-pure border border-ember/30 rounded text-sm"
                    />
                    <button onClick={() => handleSend()} className="h-8 px-3 bg-ember text-paper-pure rounded text-xs">
                      发出
                    </button>
                    <button onClick={() => { setOfferMode(false); setOfferPrice(''); }} className="h-8 px-2 text-ink-soft">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-paper-edge p-3 bg-paper-pure">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setOfferMode(!offerMode)}
                    className={cn(
                      'inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs transition-all',
                      offerMode ? 'bg-ember text-paper-pure' : 'bg-ember/10 text-ember hover:bg-ember/20',
                    )}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    讨价还价
                  </button>
                  <button className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs bg-paper-warm text-ink-soft hover:bg-paper-edge">
                    <Image className="w-3.5 h-3.5" />
                    发图
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="输入消息..."
                    className="flex-1 h-10 px-4 bg-paper border border-paper-edge rounded-full focus:outline-none focus:border-moss-400 text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="w-10 h-10 flex items-center justify-center bg-moss-500 hover:bg-moss-600 disabled:bg-moss-300 text-paper-pure rounded-full transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-ink-soft bg-gradient-to-b from-paper to-paper-warm/30">
              <MessageCircle className="w-14 h-14 mb-3 opacity-20" />
              <h3 className="font-serif text-lg text-ink mb-1">选择一个会话开始聊天</h3>
              <p className="text-sm text-ink-soft">礼貌沟通，尊重每一位书友</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
