'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Search, Book as BookIcon, Loader2, Camera, ChevronLeft, ChevronDown } from 'lucide-react';
import { booksApi } from '@/lib/api';
import { createClient } from '@/lib/supabase';

interface AddBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    token: string;
}

export default function AddBookModal({ isOpen, onClose, onSuccess, token }: AddBookModalProps) {
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Search State
    const [results, setResults] = useState<any[]>([]);
    const [preview, setPreview] = useState<any>(null); // The selected book to confirm
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Manual Form State
    const [manualForm, setManualForm] = useState({
        title: '',
        author: '',
        isbn: '',
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset results when query changes drastically (handled by search button)
    // but if user clears query, maybe clear results?
    useEffect(() => {
        if (!query && results.length > 0) {
            setResults([]);
            setPreview(null);
            setHasMore(false);
        }
    }, [query]);

    const handleSearch = async (isNewSearch = true) => {
        if (!query) return;
        setLoading(true);

        try {
            const currentPage = isNewSearch ? 1 : page + 1;
            const limit = 5;

            // Using Open Library API
            const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&page=${currentPage}&limit=${limit}`);
            const data = await res.json();
            console.log('Search results:', data);

            if (data.docs?.length > 0) {
                const newResults = data.docs.map((book: any) => ({
                    title: book.title,
                    author: book.author_name?.join(', ') || 'Autor Desconocido',
                    thumbnail: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
                    isbn: book.isbn?.[0] || '',
                    key: book.key
                }));

                if (isNewSearch) {
                    setResults(newResults);
                    setPreview(null); // Return to list view
                } else {
                    setResults(prev => [...prev, ...newResults]);
                }

                setPage(currentPage);
                setHasMore(data.num_found > (isNewSearch ? limit : (results.length + limit)));
            } else if (isNewSearch) {
                setResults([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error searching book:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBook = (book: any) => {
        setPreview(book);
    };

    const handleBackToResults = () => {
        setPreview(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File) => {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
            .from('books')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('books')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            let bookData: any;

            if (mode === 'auto') {
                if (!preview) return;
                bookData = preview;
            } else {
                if (!manualForm.title || !manualForm.author) {
                    alert('Título y Autor son obligatorios');
                    setSubmitting(false);
                    return;
                }

                let imageUrl = '';
                if (selectedImage) {
                    imageUrl = await uploadImage(selectedImage);
                }

                bookData = {
                    title: manualForm.title,
                    author: manualForm.author,
                    isbn: manualForm.isbn,
                    thumbnail: imageUrl,
                };
            }

            await booksApi.create(bookData, token);
            onSuccess();
            onClose();
            // Reset state
            setManualForm({ title: '', author: '', isbn: '' });
            setSelectedImage(null);
            setImagePreview(null);
            setResults([]);
            setPreview(null);
            setQuery('');
        } catch (error) {
            console.error('Error adding book:', error);
            alert('Error al añadir el libro. Aseguráte de que el bucket "books" existe en Supabase.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white text-gray-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-3xl font-black italic tracking-tighter">
                        Añadir <span className="text-primary not-italic">Libro</span>
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Mode Toggle */}
                <div className="flex p-1 bg-gray-100 rounded-2xl mb-6 flex-shrink-0">
                    <button
                        onClick={() => setMode('auto')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === 'auto' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
                            }`}
                    >
                        Automático
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
                            }`}
                    >
                        Carga Manual
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                    {mode === 'auto' ? (
                        <div className="space-y-6">
                            {/* Search Input (Always visible in auto) */}
                            {!preview && (
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="ISBN o Título del libro..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(true)}
                                        className="w-full bg-gray-50 text-gray-900 h-14 rounded-2xl px-6 pr-12 font-medium focus:ring-2 focus:ring-primary outline-none transition-all border border-transparent focus:border-primary/20"
                                    />
                                    <button
                                        onClick={() => handleSearch(true)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform"
                                    >
                                        {loading && results.length === 0 ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                                    </button>
                                </div>
                            )}

                            {preview ? (
                                // Preview Selected Book
                                <div className="animate-in slide-in-from-right duration-300">
                                    <button
                                        onClick={handleBackToResults}
                                        className="flex items-center text-gray-500 hover:text-primary mb-4 font-bold text-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Volver a resultados
                                    </button>

                                    <div className="bg-gray-50 p-6 rounded-3xl flex gap-6 border border-gray-100 shadow-sm">
                                        <div className="w-28 h-40 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 shadow-md">
                                            {preview.thumbnail ? (
                                                <img src={preview.thumbnail} alt={preview.title} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <BookIcon className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col justify-center flex-1">
                                            <h4 className="font-bold text-xl leading-tight mb-1">{preview.title}</h4>
                                            <p className="text-gray-500 font-medium mb-4">{preview.author}</p>
                                            <button
                                                onClick={handleConfirm}
                                                disabled={submitting}
                                                className="btn-primary w-full sm:w-fit text-sm py-3 px-8 flex items-center justify-center gap-2"
                                            >
                                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar y añadir'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : results.length > 0 ? (
                                // List of Results
                                <div className="space-y-3 animate-in fade-in duration-300">
                                    {results.map((book, index) => (
                                        <div
                                            key={`${book.key}-${index}`}
                                            onClick={() => handleSelectBook(book)}
                                            className="bg-white border-2 border-transparent hover:border-primary/20 hover:bg-gray-50 p-3 rounded-2xl flex gap-4 cursor-pointer transition-all duration-200"
                                        >
                                            <div className="w-14 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                                {book.thumbnail ? (
                                                    <img src={book.thumbnail} alt={book.title} className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <BookIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <h4 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{book.title}</h4>
                                                <p className="text-gray-500 text-sm">{book.author}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {hasMore && (
                                        <button
                                            onClick={() => handleSearch(false)}
                                            disabled={loading}
                                            className="w-full py-3 text-primary font-bold bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>
                                                    Cargar más librros
                                                    <ChevronDown className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ) : query && !loading && (
                                <div className="text-center py-10 text-gray-400">
                                    <p>No se encontraron libros para "{query}"</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Manual Mode
                        <div className="space-y-5 animate-in fade-in duration-300">
                            <div className="flex gap-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-32 h-44 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group relative"
                                >
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera className="text-white w-8 h-8" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-8 h-8 text-gray-400 mb-2 group-hover:text-primary transition-colors" />
                                            <span className="text-xs text-center font-bold text-gray-400 px-2">Tap para la Cámara</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Título</label>
                                        <input
                                            type="text"
                                            value={manualForm.title}
                                            onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                                            className="w-full bg-gray-50 text-gray-900 h-12 rounded-xl px-4 font-bold border border-transparent focus:border-primary/20 outline-none transition-all"
                                            placeholder="Título del libro"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Autor</label>
                                        <input
                                            type="text"
                                            value={manualForm.author}
                                            onChange={(e) => setManualForm({ ...manualForm, author: e.target.value })}
                                            className="w-full bg-gray-50 text-gray-900 h-12 rounded-xl px-4 font-bold border border-transparent focus:border-primary/20 outline-none transition-all"
                                            placeholder="Nombre del autor"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">ISBN (Opcional)</label>
                                <input
                                    type="text"
                                    value={manualForm.isbn}
                                    onChange={(e) => setManualForm({ ...manualForm, isbn: e.target.value })}
                                    className="w-full bg-gray-50 text-gray-900 h-12 rounded-xl px-4 font-bold border border-transparent focus:border-primary/20 outline-none transition-all"
                                    placeholder="Ej: 9781234567890"
                                />
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                            />

                            <button
                                onClick={handleConfirm}
                                disabled={submitting || !manualForm.title || !manualForm.author}
                                className="btn-primary w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-lg font-black italic shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        <BookIcon className="w-6 h-6 not-italic" />
                                        AÑADIR AHORA
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
