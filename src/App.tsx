import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Sell from '@/pages/Sell';
import BookDetail from '@/pages/BookDetail';
import Orders from '@/pages/Orders';
import Messages from '@/pages/Messages';
import Profile from '@/pages/Profile';
import { useAuthStore } from '@/store/authStore';

function AppRoutes() {
  const { fetchMe, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={
          <div className="container py-20 text-center">
            <div className="text-7xl mb-4">📚</div>
            <h2 className="font-serif text-2xl font-bold text-ink mb-2">页面走丢了</h2>
            <p className="text-ink-soft mb-4">这本书暂时不在书架上</p>
            <a href="/" className="inline-block h-10 px-5 bg-moss-500 text-paper-pure rounded-lg text-sm font-medium leading-10">
              回到首页
            </a>
          </div>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
