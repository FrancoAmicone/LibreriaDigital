'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { usersApi } from '@/lib/api';

export default function AuthCallback() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const handleAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                try {
                    console.log('Session found, syncing user...');
                    // Sincronizar con nuestro backend
                    await usersApi.sync(session.access_token, {
                        name: session.user.user_metadata.full_name,
                        image: session.user.user_metadata.avatar_url,
                        email: session.user.email,
                    });

                    console.log('Sync successful, redirecting to home');
                    router.push('/');
                } catch (error) {
                    console.error('Error syncing user:', error);
                    router.push(`/login?error=sync_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
                }
            } else {
                console.log('No session found in /auth/callback');
                router.push('/login');
            }
        };

        handleAuth();
    }, [router, supabase]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <div className="text-center">
                <h2 className="text-xl font-bold italic">Sincronizando <span className="text-primary not-italic">Cuenta</span></h2>
                <p className="text-gray-500 text-sm">Estamos preparando tu biblioteca...</p>
            </div>
        </div>
    );
}
