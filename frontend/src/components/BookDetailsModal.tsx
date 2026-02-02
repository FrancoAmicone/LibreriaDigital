'use client';

import { useEffect, useState } from 'react';
import { X, Book, User, ArrowRightLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { lendingApi } from '@/lib/api';

interface BookDetailsModalProps {
    book: any | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    token: string;
    currentUser: any;
}

export default function BookDetailsModal({ book, isOpen, onClose, onSuccess, token, currentUser }: BookDetailsModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [myRequest, setMyRequest] = useState<any>(null);
    const [loadingRequest, setLoadingRequest] = useState(false);

    useEffect(() => {
        if (isOpen && book) {
            setError('');
            loadMyRequest();
        }
    }, [isOpen, book?.id]);

    const loadMyRequest = async () => {
        if (!book || !currentUser) return;

        setLoadingRequest(true);
        try {
            const requests = await lendingApi.getMyRequests(token);
            const activeRequest = requests.find((r: any) =>
                r.bookId === book.id &&
                ['PENDING', 'APPROVED', 'DELIVERED'].includes(r.status)
            );
            setMyRequest(activeRequest || null);
        } catch (err) {
            console.error('Error loading request:', err);
        } finally {
            setLoadingRequest(false);
        }
    };

    if (!isOpen || !book) return null;

    const isOwner = book.ownerId === currentUser?.id;
    const isHolder = book.currentHolderId === currentUser?.id;
    const isAvailable = book.isAvailable ?? true;

    const handleRequestBook = async () => {
        setLoading(true);
        setError('');
        try {
            await lendingApi.createRequest(book.id, token);
            await loadMyRequest();
            onSuccess();
        } catch (err: any) {
            console.error('Error requesting book:', err);
            setError(err.message || 'Error al solicitar el libro');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!myRequest) return;

        setLoading(true);
        setError('');
        try {
            await lendingApi.cancel(myRequest.id, token);
            setMyRequest(null);
            onSuccess();
        } catch (err: any) {
            console.error('Error cancelling request:', err);
            setError(err.message || 'Error al cancelar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    const getRequestStatusDisplay = () => {
        if (!myRequest) return null;

        const statusConfig: Record<string, { icon: any; text: string; color: string; bgColor: string; borderColor: string }> = {
            PENDING: {
                icon: Clock,
                text: 'Solicitud pendiente',
                color: 'text-yellow-700',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
            },
            APPROVED: {
                icon: CheckCircle,
                text: 'Solicitud aprobada - Coordina para recoger',
                color: 'text-green-700',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
            },
            DELIVERED: {
                icon: CheckCircle,
                text: '¡Tienes este libro!',
                color: 'text-blue-700',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
            },
        };

        const config = statusConfig[myRequest.status];
        if (!config) return null;

        const Icon = config.icon;

        return (
            <div className={`p-4 rounded-xl ${config.bgColor} border-2 ${config.borderColor} flex items-center gap-3`}>
                <Icon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
                <div className="flex-1">
                    <p className={`font-bold ${config.color} text-sm`}>{config.text}</p>
                </div>
                {['PENDING', 'APPROVED'].includes(myRequest.status) && (
                    <button
                        onClick={handleCancelRequest}
                        disabled={loading}
                        className="text-sm text-gray-600 hover:text-gray-900 font-bold underline disabled:opacity-50 flex-shrink-0"
                    >
                        Cancelar
                    </button>
                )}
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header with Book Cover */}
                <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    {book.thumbnail ? (
                        <>
                            <div className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40" style={{ backgroundImage: `url(${book.thumbnail})` }} />
                            <img src={book.thumbnail} alt={book.title} className="relative h-40 w-28 object-cover rounded-lg shadow-2xl z-10" />
                        </>
                    ) : (
                        <Book className="w-20 h-20 text-gray-400 relative z-10" />
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Book Info */}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">{book.title}</h2>
                        <p className="text-gray-600 font-bold text-sm uppercase tracking-wide">{book.author}</p>
                    </div>

                    {/* Owner and Holder Info */}
                    <div className="flex items-center justify-center gap-6 py-4 px-4 bg-gray-50 rounded-2xl">
                        <div className="text-center space-y-2">
                            <span className="text-xs text-gray-500 uppercase font-black tracking-wider block">Dueño</span>
                            <div className="flex flex-col items-center">
                                {book.owner?.image ? (
                                    <img src={book.owner.image} alt={book.owner.name} className="w-12 h-12 rounded-full border-2 border-gray-200 shadow-sm mb-1" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold text-lg mb-1">
                                        {book.owner?.name?.[0] || 'U'}
                                    </div>
                                )}
                                <span className="text-sm font-bold text-gray-900">{book.owner?.name?.split(' ')[0]}</span>
                            </div>
                        </div>

                        <ArrowRightLeft className="w-5 h-5 text-gray-300 flex-shrink-0" />

                        <div className="text-center space-y-2">
                            <span className="text-xs text-gray-500 uppercase font-black tracking-wider block">Lo tiene</span>
                            <div className="flex flex-col items-center">
                                {book.currentHolder?.image ? (
                                    <img src={book.currentHolder.image} alt={book.currentHolder.name} className="w-12 h-12 rounded-full border-2 border-gray-200 shadow-sm mb-1" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg mb-1">
                                        {book.currentHolder?.name?.[0] || '?'}
                                    </div>
                                )}
                                <span className="text-sm font-bold text-gray-600">{book.currentHolder?.name?.split(' ')[0] || 'Nadie'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 text-sm rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    {/* Action Area */}
                    <div className="pt-2">
                        {loadingRequest ? (
                            <div className="text-center p-4 text-gray-400">
                                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                            </div>
                        ) : isOwner ? (
                            <div className="text-center p-4 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl font-bold">
                                Este es tu libro
                            </div>
                        ) : myRequest ? (
                            getRequestStatusDisplay()
                        ) : isAvailable ? (
                            <button
                                onClick={handleRequestBook}
                                disabled={loading}
                                className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            >
                                {loading ? 'Procesando...' : 'Solicitar Préstamo'}
                            </button>
                        ) : (
                            <div className="text-center p-4 bg-gray-100 border-2 border-gray-200 text-gray-600 rounded-xl font-bold">
                                No disponible actualmente
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
