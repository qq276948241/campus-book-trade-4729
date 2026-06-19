import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-6 border-t border-paper-edge text-center text-xs text-ink-faint">
        <div className="container">
          <p className="font-serif text-moss-700/60">书窝 · 让每本书找到下一位读者</p>
          <p className="mt-1">© 2026 书窝 · 校园二手书交易平台</p>
        </div>
      </footer>
    </div>
  );
}
