'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Book as BookIcon, Loader2, Camera } from 'lucide-react';
import { booksApi } from '@/lib/api';
import { createClient } from '@/lib/supabase';

interface EditBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    token: string;
    book: any;
}

export default function EditBookModal({ isOpen, onClose, onSuccess, token, book }: EditBookModalProps) {
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({
        title: '',
        author: '',
        isbn: '',
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load book data when modal opens
    useEffect(() => {
        if (book) {
            setForm({
                title: book.title || '',
                author: book.author || '',
                isbn: book.isbn || '',
            });
            setImagePreview(book.thumbnail || null);
        }
    }, [book]);

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
        if (!book) return;
        setSubmitting(true);
        try {
            if (!form.title || !form.author) {
                alert('Título y Autor son obligatorios');
                setSubmitting(false);
                return;
            }

            let imageUrl = book.thumbnail;
            if (selectedImage) {
                imageUrl = await uploadImage(selectedImage);
            }

            const updateData = {
                title: form.title,
                author: form.author,
                isbn: form.isbn,
                thumbnail: imageUrl,
            };

            await booksApi.update(book.id, updateData, token);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error updating book:', error);
            alert(`Error updating: ${error.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !book) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white text-gray-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-black italic tracking-tighter">
                        Editar <span className="text-primary not-italic">Libro</span>
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

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
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full bg-gray-50 text-gray-900 h-12 rounded-xl px-4 font-bold border border-transparent focus:border-primary/20 outline-none transition-all"
                                    placeholder="Título del libro"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Autor</label>
                                <input
                                    type="text"
                                    value={form.author}
                                    onChange={(e) => setForm({ ...form, author: e.target.value })}
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
                            value={form.isbn}
                            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
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
                        disabled={submitting || !form.title || !form.author}
                        className="btn-primary w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-lg font-black italic shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                    >
                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                <BookIcon className="w-6 h-6 not-italic" />
                                GUARDAR CAMBIOS
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
