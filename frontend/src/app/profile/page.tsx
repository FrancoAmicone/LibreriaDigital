'use client';

import { useEffect, useState } from 'react';
import { usersApi, booksApi } from '@/lib/api';
import { Loader2, Edit, Trash2, Book as BookIcon } from 'lucide-react';
import EditBookModal from '@/components/EditBookModal';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editingBook, setEditingBook] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);

    // Initial Fetch
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            router.push('/login');
            return;
        }
        setToken(storedToken);
        fetchUser(storedToken);
    }, []);

    const fetchUser = async (authToken: string) => {
        try {
            const userData = await usersApi.getMe(authToken);
            setUser(userData);
        } catch (error) {
            console.error('Error fetching user:', error);
            // If unauthorized, maybe redirect to login
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (bookId: string) => {
        if (!confirm('¿Estás seguro de que querés borrar este libro? Esta acción no se puede deshacer.')) return;
        if (!token) return;

        try {
            await booksApi.delete(bookId, token);
            // Refresh list
            fetchUser(token);
        } catch (error) {
            alert('Error al borrar el libro');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white text-gray-900 pb-20">
            {/* Header / Profile Info */}
            <div className="bg-gray-50 pt-12 pb-16 rounded-b-[3rem] px-6 shadow-sm">
                <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
                        {user.image ? (
                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                                {user.name?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter">{user.name}</h1>
                        <p className="text-gray-500 font-medium">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Library Section */}
            <div className="max-w-6xl mx-auto px-6 mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-3">
                    <BookIcon className="w-6 h-6 text-primary stroke-[3]" />
                    <h2 className="text-2xl font-black italic tracking-tight uppercase">Tu Biblioteca</h2>
                    <div className="h-1 flex-1 bg-gray-100 rounded-full ml-4" />
                </div>

                {user.ownedBooks?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {user.ownedBooks.map((book: any) => (
                            <div key={book.id} className="group relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="aspect-[2/3] bg-gray-100 relative overflow-hidden">
                                    {book.thumbnail ? (
                                        <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <BookIcon className="w-12 h-12" />
                                        </div>
                                    )}

                                    {/* Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                                        <button
                                            onClick={() => setEditingBook(book)}
                                            className="bg-white text-black px-4 py-2 rounded-xl font-bold text-sm w-full hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(book.id)}
                                            className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-sm w-full hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" /> Borrar
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 mb-1">{book.title}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider line-clamp-1">{book.author}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <BookIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Aún no has cargado ningún libro.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {token && (
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
            )}
        </div>
    );
}
