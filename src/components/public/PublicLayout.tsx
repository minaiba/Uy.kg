import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from '@/components/common/ScrollToTop';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
