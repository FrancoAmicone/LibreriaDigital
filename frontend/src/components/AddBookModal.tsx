'use client';

import { useState } from 'react';
import { X, Search, Book as BookIcon, Loader2 } from 'lucide-react';
import { booksApi } from '@/lib/api';

interface AddBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    token: string;
}

export default function AddBookModal({ isOpen, onClose, onSuccess, token }: AddBookModalProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        setPreview(null);
        try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.items?.length > 0) {
                const item = data.items[0].volumeInfo;
                setPreview({
                    title: item.title,
                    author: item.authors?.join(', ') || 'Autor Desconocido',
                    thumbnail: item.imageLinks?.thumbnail?.replace('http:', 'https:'),
                    isbn: item.industryIdentifiers?.[0]?.identifier || '',
                });
            }
        } catch (error) {
            console.error('Error searching book:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!preview) return;
        setSubmitting(true);
        try {
            await booksApi.create(preview, token);
            onSuccess();
            onClose();
        } catch (error) {
            alert('Error al añadir el libro');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black italic tracking-tighter">Añadir <span className="text-primary not-italic">Libro</span></h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ISBN o Título del libro..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-gray-50 dark:bg-gray-900 h-14 rounded-2xl px-6 pr-12 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                        </button>
                    </div>

                    {preview && (
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-3xl flex gap-4 animate-in zoom-in duration-300">
                            <div className="w-24 h-32 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                                {preview.thumbnail ? (
                                    <img src={preview.thumbnail} alt={preview.title} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <BookIcon className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-center gap-1">
                                <h4 className="font-bold text-lg leading-tight line-clamp-2">{preview.title}</h4>
                                <p className="text-gray-500 text-sm">{preview.author}</p>
                                <div className="mt-2">
                                    <button
                                        onClick={handleConfirm}
                                        disabled={submitting}
                                        className="btn-primary w-fit text-sm py-2 px-6 flex items-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar y añadir'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
