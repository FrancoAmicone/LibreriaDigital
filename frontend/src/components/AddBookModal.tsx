'use client';

import { useState, useRef } from 'react';
import { X, Search, Book as BookIcon, Loader2, Camera, Upload } from 'lucide-react';
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
    const [preview, setPreview] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // Manual Form State
    const [manualForm, setManualForm] = useState({
        title: '',
        author: '',
        isbn: '',
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        setPreview(null);
        try {
            // Using Open Library API as a free alternative
            const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`);
            const data = await res.json();

            if (data.docs?.length > 0) {
                const book = data.docs[0];
                const coverId = book.cover_i;

                setPreview({
                    title: book.title,
                    author: book.author_name?.join(', ') || 'Autor Desconocido',
                    thumbnail: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
                    isbn: book.isbn?.[0] || '',
                });
            }
        } catch (error) {
            console.error('Error searching book:', error);
        } finally {
            setLoading(false);
        }
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
            <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-black italic tracking-tighter">
                        Añadir <span className="text-primary not-italic">Libro</span>
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Mode Toggle */}
                <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
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

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {mode === 'auto' ? (
                        <>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="ISBN o Título del libro..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full bg-gray-50 h-14 rounded-2xl px-6 pr-12 font-medium focus:ring-2 focus:ring-primary outline-none transition-all border border-transparent focus:border-primary/20"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                                </button>
                            </div>

                            {preview && (
                                <div className="bg-gray-50 p-6 rounded-3xl flex gap-6 animate-in zoom-in duration-300 border border-gray-100">
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
                            )}
                        </>
                    ) : (
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
                                            className="w-full bg-gray-50 h-12 rounded-xl px-4 font-bold border border-transparent focus:border-primary/20 outline-none transition-all"
                                            placeholder="Título del libro"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Autor</label>
                                        <input
                                            type="text"
                                            value={manualForm.author}
                                            onChange={(e) => setManualForm({ ...manualForm, author: e.target.value })}
                                            className="w-full bg-gray-50 h-12 rounded-xl px-4 font-bold border border-transparent focus:border-primary/20 outline-none transition-all"
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
                                    className="w-full bg-gray-50 h-12 rounded-xl px-4 font-bold border border-transparent focus:border-primary/20 outline-none transition-all"
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
