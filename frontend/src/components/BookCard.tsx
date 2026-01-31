'use client';

import { Book } from 'lucide-react';

interface BookCardProps {
    title: string;
    author: string;
    thumbnail?: string | null;
    owner: { name?: string | null; image?: string | null };
    currentHolder: { name?: string | null; image?: string | null };
}

export default function BookCard({ title, author, thumbnail, owner, currentHolder }: BookCardProps) {
    const isDifferentHolder = owner.name !== currentHolder.name;

    return (
        <div className="card-book flex flex-col gap-3 group">
            {/* Portada */}
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {thumbnail ? (
                    <img src={thumbnail} alt={title} className="object-cover w-full h-full" />
                ) : (
                    <Book className="w-12 h-12 text-gray-300" />
                )}

                {/* Badge de Disponibilidad */}
                <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/90 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    {isDifferentHolder ? 'Prestado' : 'Disponible'}
                </div>
            </div>

            {/* Info */}
            <div className="space-y-1">
                <h3 className="font-bold text-sm leading-tight line-clamp-2">{title}</h3>
                <p className="text-gray-500 text-xs">{author}</p>
            </div>

            {/* Usuarios Relacionados */}
            <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex -space-x-2">
                    {owner.image && (
                        <img
                            src={owner.image}
                            alt={owner.name || ''}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-black z-10"
                            title={`Dueño: ${owner.name}`}
                        />
                    )}
                    {isDifferentHolder && currentHolder.image && (
                        <img
                            src={currentHolder.image}
                            alt={currentHolder.name || ''}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-black z-0 border-orange"
                            title={`Lo tiene: ${currentHolder.name}`}
                        />
                    )}
                </div>
                <span className="text-[10px] text-gray-400 font-medium truncate">
                    {isDifferentHolder ? `Lo tiene ${currentHolder.name?.split(' ')[0]}` : 'En casa'}
                </span>
            </div>
        </div>
    );
}
