'use client';

import { useEffect, useState } from 'react';
import { X, Book, CheckCircle, XCircle, Package, RotateCcw, Clock } from 'lucide-react';
import { lendingApi } from '@/lib/api';

interface LendingRequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    token: string;
}

export default function LendingRequestsModal({ isOpen, onClose, onSuccess, token }: LendingRequestsModalProps) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadRequests();
        }
    }, [isOpen]);

    const loadRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await lendingApi.getRequestsForMyBooks(token);
            const activeRequests = data.filter((r: any) =>
                ['PENDING', 'APPROVED', 'DELIVERED'].includes(r.status)
            );
            setRequests(activeRequests);
        } catch (err: any) {
            console.error('Error loading requests:', err);
            setError(err.message || 'Error al cargar solicitudes');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        setActionLoading(requestId);
        setError('');
        try {
            await lendingApi.approve(requestId, token);
            await loadRequests();
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Error al aprobar solicitud');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setActionLoading(requestId);
        setError('');
        try {
            await lendingApi.reject(requestId, token);
            await loadRequests();
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Error al rechazar solicitud');
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkDelivered = async (requestId: string) => {
        setActionLoading(requestId);
        setError('');
        try {
            await lendingApi.markDelivered(requestId, token);
            await loadRequests();
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Error al marcar como entregado');
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkReturned = async (requestId: string) => {
        setActionLoading(requestId);
        setError('');
        try {
            await lendingApi.markReturned(requestId, token);
            await loadRequests();
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Error al marcar como devuelto');
        } finally {
            setActionLoading(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="bg-gradient-to-r from-black to-gray-800 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white">Solicitudes de Préstamo</h2>
                        <p className="text-gray-300 text-sm mt-1">Gestiona quién puede tomar tus libros</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                            <p className="font-bold">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                            <p className="text-gray-500 mt-4 font-medium">Cargando solicitudes...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold text-lg">No hay solicitudes pendientes</p>
                            <p className="text-gray-400 text-sm mt-2">Cuando alguien solicite tus libros, aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => {
                                const isPending = request.status === 'PENDING';
                                const isApproved = request.status === 'APPROVED';
                                const isDelivered = request.status === 'DELIVERED';

                                return (
                                    <div
                                        key={request.id}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {/* Status Bar */}
                                        <div className={`h-2 ${isPending ? 'bg-yellow-400' :
                                                isApproved ? 'bg-green-400' :
                                                    'bg-blue-400'
                                            }`} />

                                        <div className="p-5">
                                            {/* Book and User Info */}
                                            <div className="flex gap-4 mb-4">
                                                {/* Book Thumbnail */}
                                                <div className="flex-shrink-0">
                                                    {request.book.thumbnail ? (
                                                        <img
                                                            src={request.book.thumbnail}
                                                            alt={request.book.title}
                                                            className="w-20 h-28 object-cover rounded-lg shadow-md"
                                                        />
                                                    ) : (
                                                        <div className="w-20 h-28 bg-gray-100 rounded-lg flex items-center justify-center">
                                                            <Book className="w-10 h-10 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-lg text-gray-900 truncate mb-1">
                                                        {request.book.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 font-medium truncate mb-3">
                                                        {request.book.author}
                                                    </p>

                                                    {/* Requester */}
                                                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 inline-flex">
                                                        {request.requester.image ? (
                                                            <img
                                                                src={request.requester.image}
                                                                alt={request.requester.name}
                                                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-sm">
                                                                {request.requester.name?.[0] || 'U'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{request.requester.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(request.createdAt).toLocaleDateString('es-AR', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="flex-shrink-0">
                                                    <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isPending ? 'bg-yellow-100 text-yellow-700' :
                                                            isApproved ? 'bg-green-100 text-green-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {isPending && <Clock className="w-4 h-4" />}
                                                        {isApproved && <CheckCircle className="w-4 h-4" />}
                                                        {isDelivered && <Package className="w-4 h-4" />}
                                                        {isPending ? 'Pendiente' : isApproved ? 'Aprobado' : 'Entregado'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                                {isPending && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(request.id)}
                                                            disabled={actionLoading === request.id}
                                                            className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request.id)}
                                                            disabled={actionLoading === request.id}
                                                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                            Rechazar
                                                        </button>
                                                    </>
                                                )}

                                                {isApproved && (
                                                    <button
                                                        onClick={() => handleMarkDelivered(request.id)}
                                                        disabled={actionLoading === request.id}
                                                        className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                                    >
                                                        <Package className="w-5 h-5" />
                                                        Marcar como Entregado
                                                    </button>
                                                )}

                                                {isDelivered && (
                                                    <button
                                                        onClick={() => handleMarkReturned(request.id)}
                                                        disabled={actionLoading === request.id}
                                                        className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                                    >
                                                        <RotateCcw className="w-5 h-5" />
                                                        Marcar como Devuelto
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
