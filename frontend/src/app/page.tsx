'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { usersApi, booksApi, lendingApi } from '@/lib/api';
import BookCard from '@/components/BookCard';
import { Plus, Settings, LogOut, Clock } from 'lucide-react';
import AddBookModal from '@/components/AddBookModal';
import BookDetailsModal from '@/components/BookDetailsModal';
import NotificationBell from '@/components/NotificationBell';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null); // State for details modal
  const [token, setToken] = useState('');
  const [hasPendingRequests, setHasPendingRequests] = useState(false);

  const fetchData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.log('No active session found, redirecting to login');
        router.push('/login');
        return;
      }

      setToken(session.access_token);

      console.log('Fetching user profile for:', session.user.id);
      const me = await usersApi.getMe(session.access_token);

      if (!me) {
        console.warn('User authenticated in Supabase but not found in app database');
        // Tal vez redirigir a una página de error o intentar sincronizar de nuevo
        router.push('/auth/callback'); // Re-intentar sincronización
        return;
      }

      setUser(me);

      if (me.status === 'ACTIVE') {
        const allBooks = await booksApi.getAll(session.access_token);

        // Filter out my own books as requested: "no les muestres al usuario su propio libro"
        // Show books where ownerId !== me.id
        const filteredBooks = allBooks.filter((book: any) => book.ownerId !== me.id);


        setBooks(filteredBooks);

        // Check for pending requests for my books
        const requests = await lendingApi.getRequestsForMyBooks(session.access_token);
        const hasPending = requests.some((r: any) => r.status === 'PENDING');
        setHasPendingRequests(hasPending);
      }
    } catch (error) {
      console.error('Error loading data in HomePage:', error);
      // Si el error es un 404 de nuestra API, significa que no está sincronizado
      if (error instanceof Error && error.message.includes('404')) {
        router.push('/auth/callback');
      }
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
          <NotificationBell token={token} />
          <button onClick={() => router.push('/profile')} className="transition-transform hover:scale-105 active:scale-95 relative">
            <img src={user?.image} className="w-8 h-8 rounded-full border-2 border-primary" alt="Profile" />
            {hasPendingRequests && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-black rounded-full shadow-sm animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      {/* Catálogo */}
      <main className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <BookCard
              key={book.id}
              {...book}
              currentUser={user} // Pass user context if needed inside card, otherwise logic handles it
              onClick={() => setSelectedBook(book)}
            />
          ))}
        </div>

        {books.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-gray-400">Aún no hay libros disponibles de otros usuarios.</p>
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

      {/* Modals */}
      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        token={token}
      />

      <BookDetailsModal
        isOpen={!!selectedBook}
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onSuccess={() => {
          fetchData();
          // Optional: Close modal on success? Or keep open to show updated status? 
          // Modal internally calls onSuccess then onClose? Yes, in handleAction.
        }}
        token={token}
        currentUser={user}
      />
    </div>
  );
}
