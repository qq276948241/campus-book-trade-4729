import type {
  ApiResponse, User, Book, BookListRes, BookDetail, CreateBookReq,
  ScanRes, Order, OrderDetail, Conversation, Message, Review, BookTag,
} from '@/types';

const BASE_URL = 'http://localhost:8080';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });
  const data = (await res.json()) as ApiResponse<T>;
  if (data.code !== 0) {
    throw new Error(data.message || '请求失败');
  }
  return data.data;
}

type BackendBook = {
  id: number; title: string; author: string; isbn: string;
  price: number; originalPrice?: number; description?: string;
  condition: string; status: string; image: string;
  tagId: number; tag?: { id: number; name: string };
  sellerId: number; seller?: { id: number; nickname: string; avatar: string; username: string; createdAt: string };
  createdAt: string; updatedAt?: string;
};

type BackendOrder = {
  id: number; orderNo: string; bookId: number;
  book?: { id: number; title: string; image: string };
  buyerId: number; sellerId: number; price: number; status: string;
  logisticsNo: string; address?: string; phone?: string; receiver?: string;
  createdAt: string; updatedAt?: string;
};

type BackendConversation = {
  id: number; user1Id: number; user2Id: number;
  user1?: { id: number; nickname: string; avatar: string; username: string; createdAt: string };
  user2?: { id: number; nickname: string; avatar: string; username: string; createdAt: string };
  bookId?: number; lastMsg: string; lastMsgAt: string; updatedAt: string;
  messages?: { isRead: boolean; receiverId: number }[];
};

type BackendMessage = {
  id: number; conversationId: number; senderId: number; receiverId: number;
  content: string; type: string; isRead: boolean; createdAt: string;
};

type BackendReview = {
  id: number; orderId: number; bookId: number; userId: number;
  user?: { id: number; nickname: string; avatar: string; username: string; createdAt: string };
  rating: number; content: string; createdAt: string;
};

type BackendLogistics = {
  id: number; orderId: number; logisticsNo: string; status: string;
  location: string; description: string; time: string; createdAt: string;
};

function convertUser(u: { id: number; username: string; nickname: string; avatar: string; phone?: string; location?: string; createdAt: string; updatedAt?: string }): User {
  return {
    ...u,
    creditScore: 100,
    nickname: (u.nickname || '').trim(),
  };
}

function convertBook(b: BackendBook): Book {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    condition: b.condition,
    price: b.price,
    originalPrice: b.originalPrice,
    tags: b.tag ? [b.tag.name] : [],
    tagId: b.tagId,
    cover: b.image,
    status: b.status === 'available' ? 'selling' : 'sold',
    sellerId: b.sellerId,
    sellerName: b.seller?.nickname?.trim() || '书窝用户',
    description: b.description,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

function convertOrder(o: BackendOrder): Order {
  const statusMap: Record<string, 'pending' | 'shipped' | 'received' | 'done'> = {
    pending: 'pending',
    shipping: 'shipped',
    completed: 'received',
    done: 'done',
  };
  return {
    id: o.id,
    orderNo: o.orderNo,
    bookId: o.bookId,
    bookTitle: o.book?.title || '',
    bookCover: o.book?.image || '',
    buyerId: o.buyerId,
    sellerId: o.sellerId,
    price: o.price,
    status: statusMap[o.status] || 'pending',
    logisticsNo: o.logisticsNo,
    address: o.address,
    phone: o.phone,
    receiver: o.receiver,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function convertConversation(c: BackendConversation, currentUserId: number): Conversation {
  const peer = c.user1Id === currentUserId ? c.user2 : c.user1;
  const unread = (c.messages || []).filter(
    (m) => m.receiverId === currentUserId && !m.isRead,
  ).length;
  return {
    id: c.id,
    peerUser: peer ? convertUser(peer) : {
      id: 0, username: '', nickname: '未知用户', avatar: '', creditScore: 100, createdAt: '',
    },
    lastMessage: c.lastMsg || '',
    unread,
    updatedAt: c.lastMsgAt || c.updatedAt,
    bookId: c.bookId,
  };
}

function convertMessage(m: BackendMessage): Message {
  return {
    id: m.id,
    conversationId: m.conversationId,
    fromUserId: m.senderId,
    content: m.content,
    type: m.type,
    createdAt: m.createdAt,
    isRead: m.isRead,
  };
}

function convertReview(r: BackendReview): Review {
  return {
    id: r.id,
    orderId: r.orderId,
    bookId: r.bookId,
    fromUser: r.user ? convertUser(r.user) : {
      id: r.userId, username: '', nickname: '书窝用户', avatar: '', creditScore: 100, createdAt: '',
    },
    toUserId: 0,
    score: r.rating,
    content: r.content,
    createdAt: r.createdAt,
  };
}

function convertLogistics(l: BackendLogistics): { time: string; location: string; desc: string } {
  return {
    time: l.time,
    location: l.location,
    desc: l.description,
  };
}

export const api = {
  auth: {
    register: async (username: string, password: string, nickname: string) => {
      const res = await request<{ token: string; user: { id: number; username: string; nickname: string; avatar: string; createdAt: string } }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, nickname }),
      });
      return { token: res.token, user: convertUser(res.user) };
    },
    login: async (username: string, password: string) => {
      const res = await request<{ token: string; user: { id: number; username: string; nickname: string; avatar: string; createdAt: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      return { token: res.token, user: convertUser(res.user) };
    },
    me: async () => {
      const res = await request<{ id: number; username: string; nickname: string; avatar: string; createdAt: string }>('/api/auth/me');
      return convertUser(res);
    },
  },
  books: {
    list: async (params: { tag?: string; keyword?: string; page?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.tag) q.set('tag', params.tag);
      if (params.keyword) q.set('keyword', params.keyword);
      if (params.page) q.set('page', String(params.page));
      const res = await request<{
        list: BackendBook[]; total: number; page: number; pageSize: number;
      }>(`/api/books${q.toString() ? '?' + q.toString() : ''}`);
      return {
        list: res.list.map(convertBook),
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
      } as BookListRes;
    },
    detail: async (id: number) => {
      const res = await request<BackendBook & { seller: { id: number; username: string; nickname: string; avatar: string; createdAt: string } }>(`/api/books/${id}`);
      return {
        ...convertBook(res),
        seller: convertUser(res.seller),
      } as BookDetail;
    },
    create: async (data: CreateBookReq) => {
      const res = await request<BackendBook>('/api/books', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          author: data.author,
          isbn: data.isbn,
          price: data.price,
          originalPrice: data.originalPrice,
          description: data.description,
          condition: data.condition,
          image: data.cover,
          tagId: data.tagId,
        }),
      });
      return convertBook(res);
    },
    update: async (id: number, data: Partial<CreateBookReq>) => {
      const res = await request<BackendBook>(`/api/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: data.title,
          author: data.author,
          isbn: data.isbn,
          price: data.price,
          description: data.description,
          condition: data.condition,
          image: data.cover,
          tagId: data.tagId,
        }),
      });
      return convertBook(res);
    },
    remove: async (id: number) => request<null>(`/api/books/${id}`, { method: 'DELETE' }),
    scan: async (isbn: string) => {
      const res = await request<{ title: string; author: string; originalPrice?: number; description?: string }>('/api/books/scan', {
        method: 'POST',
        body: JSON.stringify({ isbn }),
      });
      return res as ScanRes;
    },
  },
  tags: {
    list: async () => {
      const res = await request<BookTag[]>('/api/tags');
      return { tags: res.map((t) => t.name), raw: res };
    },
  },
  orders: {
    create: async (bookId: number, address: string = '校园自取', phone: string = '13800000000', receiver: string = '同学') => {
      const res = await request<BackendOrder>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ bookId, address, phone, receiver }),
      });
      return { order: convertOrder(res) };
    },
    list: async () => {
      const res = await request<BackendOrder[]>('/api/orders');
      return { orders: res.map(convertOrder) };
    },
    detail: async (id: number) => {
      const res = await request<{ order: BackendOrder; logistics: BackendLogistics[] }>(`/api/orders/${id}`);
      return {
        ...convertOrder(res.order),
        logistics: res.logistics.map(convertLogistics),
      } as OrderDetail;
    },
    ship: async (id: number, logisticsNo: string) =>
      request<null>(`/api/orders/${id}/ship`, {
        method: 'PUT',
        body: JSON.stringify({ logisticsNo }),
      }),
    confirm: async (id: number) =>
      request<null>(`/api/orders/${id}/confirm`, { method: 'PUT' }),
  },
  messages: {
    conversations: async () => {
      const token = getToken();
      let currentUserId = 0;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          currentUserId = payload.userId || 0;
        } catch { /* empty */ }
      }
      const res = await request<BackendConversation[]>('/api/messages/conversations');
      return { conversations: res.map((c) => convertConversation(c, currentUserId)) };
    },
    list: async (conversationId: number) => {
      const res = await request<BackendMessage[]>(`/api/messages/${conversationId}`);
      return { messages: res.map(convertMessage).reverse() };
    },
    send: async (conversationId: number, receiverId: number, content: string, type: 'text' | 'offer' = 'text') => {
      const res = await request<BackendMessage>('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ conversationId, receiverId, content, type }),
      });
      return convertMessage(res);
    },
    createConversation: async (userId: number, bookId?: number) => {
      const res = await request<BackendConversation>('/api/messages/conversation', {
        method: 'POST',
        body: JSON.stringify({ userId, bookId }),
      });
      const token = getToken();
      let currentUserId = 0;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          currentUserId = payload.userId || 0;
        } catch { /* empty */ }
      }
      return { conversation: convertConversation(res, currentUserId) };
    },
  },
  reviews: {
    create: async (orderId: number, bookId: number, rating: number, content: string) => {
      const res = await request<BackendReview>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ orderId, bookId, rating, content }),
      });
      return convertReview(res);
    },
    list: async (userId?: number) => {
      const q = userId ? `?userId=${userId}` : '';
      const res = await request<BackendReview[]>(`/api/reviews${q}`);
      return { reviews: res.map(convertReview) };
    },
  },
  profile: {
    myBooks: async () => {
      const res = await request<BackendBook[]>('/api/profile/books');
      return { books: res.map(convertBook) };
    },
    myOrders: async (type?: 'buy' | 'sell') => {
      const q = type ? `?type=${type}` : '';
      const res = await request<BackendOrder[]>(`/api/profile/orders${q}`);
      return { orders: res.map(convertOrder) };
    },
    myReviews: async () => {
      const res = await request<BackendReview[]>('/api/profile/reviews');
      return { reviews: res.map(convertReview) };
    },
  },
  upload: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ url: string }>('/api/upload', {
      method: 'POST',
      body: form,
    });
  },
};
