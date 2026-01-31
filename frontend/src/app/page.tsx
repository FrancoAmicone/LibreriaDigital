'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { usersApi, booksApi } from '@/lib/api';
import BookCard from '@/components/BookCard';
import { Plus, Settings, LogOut, Clock } from 'lucide-react';
import AddBookModal from '@/components/AddBookModal';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState('');

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    setToken(session.access_token);

    try {
      const me = await usersApi.getMe(session.access_token);
      setUser(me);

      if (me.status === 'ACTIVE') {
        const allBooks = await booksApi.getAll(session.access_token);
        setBooks(allBooks);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  // Estado PENDING
  if (user?.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="bg-orange/10 p-4 rounded-full">
          <Clock className="w-12 h-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black italic">Acceso <span className="text-primary not-italic">Pendiente</span></h2>
          <p className="text-gray-500 max-w-xs mx-auto">
            ¡Hola {user?.name}! Tu cuenta está siendo revisada por el administrador para asegurar que todos seamos amigos.
          </p>
        </div>
        <button onClick={handleLogout} className="text-sm font-bold text-gray-400 flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-900">
        <h1 className="text-2xl font-black italic tracking-tighter">
          L<span className="text-primary not-italic">A</span>
        </h1>
        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <img src={user?.image} className="w-8 h-8 rounded-full border-2 border-primary" alt="Profile" />
        </div>
      </header>

      {/* Catálogo */}
      <main className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>

        {books.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-gray-400">Aún no hay libros en la biblioteca.</p>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white dark:bg-white dark:text-black flex items-center gap-2 px-6 py-4 rounded-full font-bold shadow-2xl transition-transform active:scale-90 z-50 ring-4 ring-primary/20"
      >
        <Plus className="w-5 h-5" />
        Añadir Libro
      </button>

      {/* Modal */}
      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        token={token}
      />
    </div>
  );
}
