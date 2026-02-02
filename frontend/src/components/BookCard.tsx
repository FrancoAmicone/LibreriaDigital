'use client';

import { Book } from 'lucide-react';

interface BookCardProps {
    id: string; // Needed for key and logic
    title: string;
    author: string;
    thumbnail?: string | null;
    owner: { name?: string | null; image?: string | null };
    currentHolder: { name?: string | null; image?: string | null };
    ownerId: string; // Needed for logic if creating local derived state, already passed in props usually?
    isAvailable?: boolean; // New prop for syncing availability
    onClick?: () => void; // New prop for modal interaction
}

export default function BookCard({ title, author, thumbnail, owner, currentHolder, isAvailable, onClick }: BookCardProps) {
    const isDifferentHolder = owner.name !== currentHolder.name;

    // Si isAvailable es false, significa que no está disponible para nadie (o lógica similar).
    // Si isDifferentHolder es true, está prestado.
    // Prioridad: Si isAvailable es false -> NO DISPONIBLE. Si isDifferentHolder -> PRESTADO. Sino -> DISPONIBLE.
    // A falta de spec exacta, usaremos la lógica visual existente + isAvailable.

    let statusText = 'Disponible';
    let statusColor = 'bg-white/90 text-black dark:bg-black/90 dark:text-white';

    if (isDifferentHolder) {
        statusText = 'Prestado';
        statusColor = 'bg-orange text-white'; // Asumiendo color orange definido en tailwind o similar
    } else if (isAvailable === false) {
        statusText = 'No Disp.';
        statusColor = 'bg-gray-200 text-gray-500';
    }

    return (
        <div
            onClick={onClick}
            className="card-book flex flex-col gap-3 cursor-pointer active:scale-95 transition-transform"
        >
            {/* Portada */}
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm">
                {thumbnail ? (
                    <img src={thumbnail} alt={title} className="object-cover w-full h-full" />
                ) : (
                    <Book className="w-12 h-12 text-gray-300" />
                )}

                {/* Badge de Disponibilidad */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm ${statusColor}`}>
                    {statusText}
                </div>
            </div>

            {/* Info */}
            <div className="space-y-1">
                {/* High Contrast Title */}
                <h3 className="font-black text-sm leading-tight line-clamp-2 text-black">
                    {title}
                </h3>
                <p className="text-gray-500 text-xs font-medium">{author}</p>
            </div>

            {/* Usuarios Relacionados */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    {owner.image ? (
                        <div className="relative">
                            <img
                                src={owner.image}
                                alt={owner.name || ''}
                                className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700"
                                title={`Dueño: ${owner.name}`}
                            />
                            {/* Propietario Name next to photo? Space is tight. Maybe just name if single? */}
                        </div>
                    ) : null}
                    {/* Owner Name Check: "Añadi el nombre del dueño al lado de la foto de perfil" */}
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
                        {owner.name?.split(' ')[0]}
                    </span>
                </div>

                {isDifferentHolder && currentHolder.image && (
                    <div className="flex items-center">
                        <img
                            src={currentHolder.image}
                            alt={currentHolder.name || ''}
                            className="w-5 h-5 rounded-full border border-white dark:border-black opacity-70"
                            title={`Lo tiene: ${currentHolder.name}`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
