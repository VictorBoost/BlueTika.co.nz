import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, ShoppingBag, LogOut, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function App() {
    const [user, setUser] = useState < any > (null);
    const [loading, setLoading] = useState(true);
    const [activeApp, setActiveApp] = useState < 'hub' | 'marketplace' | 'tikachat' > ('hub');

    useEffect(() => {
        // This connects to your .co.nz user vault
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({ provider: 'google' });
    };

    const handleLogout = async () => await supabase.auth.signOut();

    if (loading) return <div className="h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest bg-[#f8f8f7]">Syncing identity...</div>;

    return (
        <div className="min-h-screen bg-[#f8f8f7] text-[#0a0a0a] font-sans">
            {/* Shared Navigation */}
            <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-[#f8f8f7]/80 backdrop-blur-xl border-b border-black/5">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveApp('hub')}>
                    <div className="w-10 h-10 bg-[#0a0a0a] rounded-xl flex items-center justify-center text-white font-bold italic transition-transform hover:rotate-6">B</div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tighter leading-none">Bluetika Hub</h1>
                        <span className="text-[10px] uppercase font-bold opacity-40">Shared with .co.nz</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {!user ? (
                        <button onClick={handleLogin} className="bg-[#0a0a0a] text-white px-6 py-2 rounded-full text-xs font-bold uppercase">Login</button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-medium">{user.email}</span>
                            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><LogOut size={18} /></button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Shared Main View */}
            <main className="pt-40 px-8 max-w-6xl mx-auto">
                <AnimatePresence mode="wait">
                    {activeApp === 'hub' ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                            <h2 className="text-8xl font-medium tracking-tighter mb-10 leading-[0.85]">One Account. <br />All <span className="text-orange-500 underline underline-offset-8">Services.</span></h2>
                            <p className="text-gray-400 mb-12 max-w-sm mx-auto">Connecting Marketplace Escrow and AI Chat seamlessly.</p>

                            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                <button onClick={() => setActiveApp('marketplace')} className="p-10 border-2 border-black rounded-[2.5rem] bg-white hover:bg-blue-50 transition-colors text-left group">
                                    <ShoppingBag size={32} className="mb-6 group-hover:scale-110 transition-transform" />
                                    <div className="font-bold uppercase tracking-widest text-xs">Marketplace (.co.nz)</div>
                                    <ArrowRight className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button onClick={() => setActiveApp('tikachat')} className="p-10 bg-[#0a0a0a] text-white rounded-[2.5rem] hover:bg-orange-600 transition-colors text-left group">
                                    <Bot size={32} className="mb-6 text-orange-400 group-hover:text-white transition-all group-hover:scale-110" />
                                    <div className="font-bold uppercase tracking-widest text-xs">TikaChat AI (.nz)</div>
                                    <ArrowRight className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border-2 border-black rounded-[2.5rem] p-12 text-center shadow-xl">
                            <button onClick={() => setActiveApp('hub')} className="text-[10px] font-bold uppercase mb-8 hover:text-orange-600">← Back to Hub</button>
                            <h3 className="text-3xl font-bold mb-4">{activeApp === 'tikachat' ? 'TikaChat Service' : 'Marketplace Dashboard'}</h3>
                            <p className="text-gray-400 max-w-xs mx-auto mb-10">Connected to your shared vault. All payment methods and user data are syncing...</p>
                            <div className="bg-green-50 text-green-700 px-6 py-3 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-2">
                                <ShieldCheck size={14} /> Identity Verified: {user?.email || 'Guest Session'}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="fixed bottom-0 w-full p-8 flex justify-between items-center z-10 opacity-30 pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-widest">Database Node: Shared-Master-1</span>
            </footer>
        </div>
    );
}