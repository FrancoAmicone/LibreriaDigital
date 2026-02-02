'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { usersApi, booksApi, lendingApi } from '@/lib/api';
import { Loader2, Edit, Trash2, Book as BookIcon, ChevronLeft, Bell } from 'lucide-react';
import EditBookModal from '@/components/EditBookModal';
import LendingRequestsModal from '@/components/LendingRequestsModal';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editingBook, setEditingBook] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [showLendingRequests, setShowLendingRequests] = useState(false);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [borrowedBooks, setBorrowedBooks] = useState<any[]>([]);

    const supabase = createClient();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                router.push('/login');
                return;
            }

            setToken(session.access_token);
            fetchUser(session.access_token);
        };

        checkSession();
    }, []);

    const fetchUser = async (authToken: string) => {
        try {
            const userData = await usersApi.getMe(authToken);
            setUser(userData);
            loadPendingRequestsCount(authToken);
            loadBorrowedBooks(authToken);
        } catch (error) {
            console.error('Error fetching user:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const loadPendingRequestsCount = async (authToken: string) => {
        try {
            const requests = await lendingApi.getRequestsForMyBooks(authToken);
            const pending = requests.filter((r: any) => r.status === 'PENDING');
            setPendingRequestsCount(pending.length);
        } catch (error) {
            console.error('Error loading pending requests:', error);
        }
    };

    const loadBorrowedBooks = async (authToken: string) => {
        try {
            const requests = await lendingApi.getMyRequests(authToken);
            const delivered = requests.filter((r: any) => r.status === 'DELIVERED');
            setBorrowedBooks(delivered);
        } catch (error) {
            console.error('Error loading borrowed books:', error);
        }
    };

    const handleDelete = async (bookId: string) => {
        if (!confirm('¿Estás seguro de que querés borrar este libro? Esta acción no se puede deshacer.')) return;
        if (!token) return;

        try {
            await booksApi.delete(bookId, token);
            fetchUser(token);
        } catch (error) {
            alert('Error al borrar el libro');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Profile Info */}
            <div className="bg-white shadow-sm relative">
                <button
                    onClick={() => router.push('/')}
                    className="absolute top-6 left-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-900" />
                </button>

                <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-4 py-12">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                        {user.image ? (
                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-black flex items-center justify-center text-white text-3xl font-bold">
                                {user.name?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">{user.name}</h1>
                        <p className="text-gray-600 font-medium mt-1">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Lending Requests Section */}
            <div className="max-w-6xl mx-auto px-6 mt-8">
                <button
                    onClick={() => setShowLendingRequests(true)}
                    className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg relative"
                >
                    <Bell className="w-6 h-6" />
                    <span>Solicitudes de Préstamo</span>
                    {pendingRequestsCount > 0 && (
                        <span className="absolute top-3 right-3 bg-white text-black text-xs font-black px-3 py-1 rounded-full shadow-md">
                            {pendingRequestsCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Borrowed Books Section */}
            {borrowedBooks.length > 0 && (
                <div className="max-w-6xl mx-auto px-6 mt-12 space-y-6">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-7 h-7 text-blue-600 stroke-[2.5]" />
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Libros que estás leyendo</h2>
                        <div className="h-1 flex-1 bg-blue-100 rounded-full ml-4" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {borrowedBooks.map((request: any) => (
                            <div key={request.id} className="bg-white border-2 border-blue-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="aspect-[2/3] bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                    {request.book.thumbnail ? (
                                        <img src={request.book.thumbnail} alt={request.book.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <BookIcon className="w-12 h-12 text-gray-300" />
                                    )}
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                        En tu poder
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-black text-gray-900 leading-tight line-clamp-2 mb-1 text-sm sm:text-base">
                                        {request.book.title}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider line-clamp-1 mb-2">
                                        {request.book.author}
                                    </p>
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                        <img src={request.book.owner?.image} className="w-5 h-5 rounded-full" alt="" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Dueño: {request.book.owner?.name?.split(' ')[0]}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Library Section */}
            <div className="max-w-6xl mx-auto px-6 mt-12 space-y-6">
                <div className="flex items-center gap-3">
                    <BookIcon className="w-7 h-7 text-black stroke-[2.5]" />
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Tu Biblioteca</h2>
                    <div className="h-1 flex-1 bg-gray-200 rounded-full ml-4" />
                </div>

                {user.ownedBooks?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {user.ownedBooks.map((book: any) => (
                            <div key={book.id} className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="aspect-[2/3] bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                    {book.thumbnail ? (
                                        <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <BookIcon className="w-12 h-12 text-gray-300" />
                                    )}

                                    {!book.isAvailable && (
                                        <div className="absolute top-2 right-2 bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                            Prestado
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-black text-gray-900 leading-tight line-clamp-2 mb-1 text-sm sm:text-base">
                                        {book.title}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider line-clamp-1 mb-4">
                                        {book.author}
                                    </p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingBook(book)}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(book.id)}
                                            className="w-11 bg-gray-100 hover:bg-red-50 text-gray-900 hover:text-red-600 py-2.5 rounded-xl flex items-center justify-center transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <BookIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-900 font-bold text-lg">Aún no has cargado ningún libro</p>
                        <p className="text-gray-500 text-sm mt-2">Agrega libros desde la página principal</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {token && (
                <>
                    <EditBookModal
                        isOpen={!!editingBook}
                        onClose={() => setEditingBook(null)}
                        onSuccess={() => {
                            fetchUser(token);
                            setEditingBook(null);
                        }}
                        token={token}
                        book={editingBook}
                    />
                    <LendingRequestsModal
                        isOpen={showLendingRequests}
                        onClose={() => setShowLendingRequests(false)}
                        onSuccess={() => {
                            if (token) {
                                fetchUser(token);
                            }
                        }}
                        token={token}
                    />
                </>
            )}
        </div>
    );
}
