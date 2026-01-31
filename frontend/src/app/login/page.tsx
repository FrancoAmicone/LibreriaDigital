'use client';

import { createClient } from '@/lib/supabase';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
    const supabase = createClient();

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-black">
            <div className="w-full max-w-sm text-center space-y-8">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black tracking-tighter italic">
                        Libreria<span className="text-primary NOT-italic">Amicone</span>
                    </h1>
                    <p className="text-gray-500 font-medium">La biblioteca de los amigos.</p>
                </div>

                <button
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-black text-white dark:bg-white dark:text-black h-14 rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-xl"
                >
                    <LogIn className="w-5 h-5" />
                    Entrar con Google
                </button>

                <p className="text-xs text-gray-400 max-w-[200px] mx-auto">
                    Esta es una aplicación privada. Necesitarás ser aprobado por un admin después de entrar.
                </p>
            </div>
        </div>
    );
}
