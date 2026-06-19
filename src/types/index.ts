export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  creditScore: number;
  phone?: string;
  location?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookTag {
  id: number;
  name: string;
  createdAt: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  condition: string;
  price: number;
  originalPrice?: number;
  tags: string[];
  tagId: number;
  cover: string;
  status: 'selling' | 'sold';
  sellerId: number;
  sellerName: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookDetail extends Book {
  seller: User;
}

export interface BookListRes {
  list: Book[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateBookReq {
  isbn: string;
  title: string;
  author: string;
  condition: string;
  price: number;
  tagId: number;
  cover: string;
  description: string;
  originalPrice?: number;
}

export interface ScanRes {
  title: string;
  author: string;
  originalPrice?: number;
  description?: string;
}

export interface Order {
  id: number;
  orderNo: string;
  bookId: number;
  bookTitle: string;
  bookCover: string;
  buyerId: number;
  sellerId: number;
  price: number;
  status: 'pending' | 'shipped' | 'received' | 'done';
  logisticsNo: string;
  address?: string;
  phone?: string;
  receiver?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LogisticsItem {
  time: string;
  location: string;
  desc: string;
  status?: string;
}

export interface OrderDetail extends Order {
  logistics: LogisticsItem[];
}

export interface Conversation {
  id: number;
  peerUser: User;
  lastMessage: string;
  unread: number;
  updatedAt: string;
  bookId?: number;
}

export interface Message {
  id: number;
  conversationId: number;
  fromUserId: number;
  content: string;
  type: string;
  createdAt: string;
  isRead?: boolean;
}

export interface Review {
  id: number;
  orderId: number;
  bookId: number;
  fromUser: User;
  toUserId: number;
  score: number;
  content: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}
