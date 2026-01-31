'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { usersApi } from '@/lib/api';
import { ArrowLeft, UserCheck, ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminPage() {
    const router = useRouter();
    const supabase = createClient();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState('');

    const fetchUsers = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push('/login');

        setToken(session.access_token);
        try {
            const data = await usersApi.getAll(session.access_token);
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [router, supabase]);

    const handleApprove = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
        try {
            await usersApi.updateStatus(userId, newStatus, token);
            fetchUsers();
        } catch (error) {
            alert('Error updating user');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => router.push('/')} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-black italic">Panel <span className="text-primary not-italic">Admin</span></h1>
            </header>

            <div className="space-y-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-3xl shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src={user.image} alt={user.name} className="w-12 h-12 rounded-full border-2 border-primary" />
                            <div>
                                <h3 className="font-bold">{user.name}</h3>
                                <p className="text-xs text-gray-500">{user.email}</p>
                                <div className={`mt-1 text-[10px] uppercase font-black tracking-widest ${user.status === 'ACTIVE' ? 'text-green-500' : 'text-orange'}`}>
                                    {user.status}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleApprove(user.id, user.status)}
                            className={`p-3 rounded-2xl transition-all active:scale-90 ${user.status === 'ACTIVE'
                                    ? 'bg-gray-100 text-gray-400 hover:text-red-500'
                                    : 'bg-primary/20 text-primary hover:bg-primary hover:text-white'
                                }`}
                        >
                            {user.status === 'ACTIVE' ? <ShieldAlert className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
