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
                    // Sincronizar con nuestro backend
                    await usersApi.sync(session.access_token, {
                        name: session.user.user_metadata.full_name,
                        image: session.user.user_metadata.avatar_url,
                        email: session.user.email,
                    });

                    router.push('/');
                } catch (error) {
                    console.error('Error syncing user:', error);
                    router.push('/login?error=sync_failed');
                }
            } else {
                router.push('/login');
            }
        };

        handleAuth();
    }, [router, supabase]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
    );
}
