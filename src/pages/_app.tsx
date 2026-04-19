import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShoppingBag,
    Search,
    ShieldCheck,
    ArrowRight,
    Zap,
    Globe,
    Award,
    Users,
    Leaf,
    Waves,
    Briefcase,
    Handshake,
    CreditCard,
    Lock,
    CheckCircle2,
    Bot,
    MessageCircle,
    LogOut
} from 'lucide-react';
import { supabase } from './lib/supabase';

export default function App() {
    const [user, setUser] = useState < any > (null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState < 'marketplace' | 'tikachat' > ('marketplace');

    useEffect(() => {
        // Safety timeout to ensure page loads even if auth is slow
        const timeout = setTimeout(() => setLoading(false), 2000);

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
    };

    const handleLogout = async () => await supabase.auth.signOut();

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-[#F8F5F2] font-mono text-xs uppercase tracking-[0.3em] text-[#1A2F1F]">
            Syncing BlueTika Whānau...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F5F2] text-[#1A2F1F] font-sans selection:bg-[#FFD04D] selection:text-[#1A2F1F]">
            {/* 1. PREMIUM NAVIGATION */}
            <nav className="fixed top-0 w-full z-50 px-12 py-5 flex justify-between items-center bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveView('marketplace')}>
                    <div className="w-10 h-10 bg-[#1A2F1F] rounded-xl flex items-center justify-center text-white font-black italic transform group-hover:rotate-12 transition-transform shadow-lg">B</div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tighter leading-none font-serif">BlueTika</h1>
                        <span className="text-[9px] uppercase tracking-widest opacity-40 font-black">Aotearoa Trusted</span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <nav className="hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-[#1A2F1F]/60">
                        <span className="hover:text-amber-600 cursor-pointer transition-colors">Post a Project</span>
                        <span className="hover:text-amber-600 cursor-pointer transition-colors">Browse Projects</span>
                        <span className="hover:text-amber-600 cursor-pointer transition-colors">My Contracts</span>
                    </nav>

                    <div className="flex items-center gap-4">
                        {!user ? (
                            <button onClick={handleLogin} className="bg-[#1A2F1F] text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#FFD04D] hover:text-[#1A2F1F] transition-all shadow-md active:scale-95">Member Login</button>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex flex-col items-end text-right">
                                    <span className="text-[9px] font-bold uppercase opacity-30 tracking-widest leading-none">Authorized</span>
                                    <span className="text-sm font-semibold">{user.email?.split('@')[0]}</span>
                                </div>
                                <button onClick={handleLogout} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-slate-400 hover:text-red-500 font-bold"><LogOut size={18} /></button>
                            </div>
                        )}
                        <button onClick={() => setActiveView('tikachat')} className="p-2.5 bg-[#FFD04D]/10 text-[#1A2F1F] rounded-full hover:bg-[#FFD04D]/20 transition-all">
                            <Bot size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-20">
                <AnimatePresence mode="wait">
                    {activeView === 'marketplace' ? (
                        <motion.div key="marketplace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white min-h-screen">
                            {/* --- HERO: AIRTASKER INSPIRED + NZ CULTURE --- */}
                            <header className="bg-[#1A2F1F] text-white py-32 px-12 text-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                                    <Leaf size={700} className="absolute -right-20 -top-20 rotate-45" />
                                    <Waves size={700} className="absolute -left-20 -bottom-20" />
                                </div>

                                <div className="relative z-10 max-w-5xl mx-auto">
                                    <div className="inline-flex items-center gap-2 bg-white/10 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-12 border border-white/5">
                                        <ShieldCheck size={16} className="text-[#FFD04D]" /> Trusted by 10,000+ Kiwi Whānau
                                    </div>
                                    <h1 className="text-8xl md:text-[9.5rem] font-black tracking-tighter mb-10 leading-[0.85] font-serif">
                                        Projects made easy. <br />
                                        <span className="italic text-[#FFD04D]">Contracts secured.</span>
                                    </h1>
                                    <p className="text-xl md:text-2xl text-white/60 mb-20 max-w-2xl mx-auto font-medium leading-relaxed">
                                        Connecting New Zealand <span className="text-white font-bold">Clients</span> with local <span className="text-white font-bold">Service Providers</span>. Secure your mahi with bank-grade escrow protection.
                                    </p>

                                    {/* AIRTASKER SEARCH BOX */}
                                    <div className="bg-white rounded-[2.5rem] p-3 flex flex-col md:flex-row gap-3 shadow-[0_45px_100px_-20px_rgba(0,0,0,0.5)] max-w-3xl mx-auto transform translate-y-12 text-[#1A2F1F]">
                                        <div className="flex-[1.5] flex items-center gap-6 px-8 py-5 bg-slate-50 rounded-[2rem] border border-black/5 shadow-inner">
                                            <Search size={22} className="opacity-30" />
                                            <input type="text" placeholder="What project do you need a hand with?" className="bg-transparent border-none outline-none w-full text-xl font-black placeholder:text-slate-300" />
                                        </div>
                                        <button className="bg-[#FFD04D] text-[#1A2F1F] px-14 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#1A2F1F] hover:text-white transition-all shadow-xl active:scale-95">
                                            Search Projects
                                        </button>
                                    </div>
                                </div>
                            </header>

                            {/* --- WORKFLOW: PROJECT TO CONTRACT --- */}
                            <section className="pt-48 pb-32 px-12 max-w-7xl mx-auto text-center">
                                <div className="mb-24">
                                    <div className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-600 mb-6 font-bold">Marketplace Service Workflow</div>
                                    <h3 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">The BlueTika Way</h3>
                                    <div className="w-20 h-1 bg-[#FFD04D] mx-auto rounded-full" />
                                </div>

                                <div className="grid md:grid-cols-3 gap-20 relative">
                                    <div className="absolute top-12 left-0 w-full h-px border-t-2 border-dashed border-slate-100 hidden lg:block -z-10" />
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 bg-white border border-black/5 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl text-[#1A2F1F]"><Briefcase size={32} /></div>
                                        <h4 className="font-black text-xs uppercase tracking-widest mb-4">1. Post a Project</h4>
                                        <p className="text-sm text-slate-500 max-w-[20ch] leading-relaxed font-medium">Clients describe their project and set an NZD budget.</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 bg-white border border-black/5 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl text-[#1A2F1F]"><Handshake size={32} /></div>
                                        <h4 className="font-black text-xs uppercase tracking-widest mb-4">2. Bids & Offers</h4>
                                        <p className="text-sm text-slate-500 max-w-[20ch] leading-relaxed font-medium">Service Providers bid on the work. Chat and check history.</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 bg-[#FFD04D] rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl text-[#1A2F1F]"><ShieldCheck size={32} /></div>
                                        <h4 className="font-black text-xs uppercase tracking-widest mb-4">3. Award Contract</h4>
                                        <p className="text-sm font-bold text-[#1A2F1F] leading-relaxed max-w-[20ch]">Once you award the contract, funds move to secure escrow.</p>
                                    </div>
                                </div>
                            </section>

                            {/* --- TRUST SECTION --- */}
                            <section className="bg-white py-32 px-12 border-y border-black/5 overflow-hidden">
                                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20 items-center">
                                    <div className="flex-1">
                                        <div className="text-[11px] font-black uppercase tracking-[0.5em] text-[#1A2F1F]/40 mb-8 flex items-center gap-3">
                                            <div className="h-px w-8 bg-black/10" /> OUR TIKANGA ASSET
                                        </div>
                                        <h3 className="text-5xl md:text-7xl font-black tracking-tighter mb-10 leading-[0.9] font-serif">Trust built on <span className="italic text-amber-500">Manaakitanga</span>.</h3>
                                        <div className="space-y-12">
                                            <div className="flex gap-10 group">
                                                <div className="w-20 h-20 bg-[#F8F5F2] rounded-[2.5rem] flex items-center justify-center text-[#1A2F1F] flex-shrink-0 group-hover:bg-[#1A2F1F] group-hover:text-white transition-all shadow-xl"><Users size={32} /></div>
                                                <div>
                                                    <h4 className="font-black text-sm uppercase tracking-widest mb-4">Verified Service Providers</h4>
                                                    <p className="text-slate-500 text-lg leading-relaxed font-medium">We vet every provider for all project contracts.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-10 group">
                                                <div className="w-20 h-20 bg-[#F8F5F2] rounded-[2.5rem] flex items-center justify-center text-[#1A2F1F] flex-shrink-0 group-hover:bg-[#1A2F1F] group-hover:text-white transition-all shadow-xl"><Lock size={32} /></div>
                                                <div>
                                                    <h4 className="font-black text-sm uppercase tracking-widest mb-4">Escrow Deposit Lock</h4>
                                                    <p className="text-slate-500 text-lg leading-relaxed font-medium">Funds are only released from the NZ vault when the contract is complete.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 relative">
                                        <div className="rounded-[5rem] overflow-hidden shadow-2xl border border-black/5 rotate-3 hover:rotate-0 transition-transform duration-700">
                                            <img src="https://picsum.photos/seed/nz-pro/1000/1200" alt="Certified Kiwi Pro" className="w-full h-full object-cover grayscale opacity-80" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="absolute -bottom-10 -right-10 bg-[#FFD04D] text-[#1A2F1F] px-10 py-6 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl">100% NZ Owned</div>
                                    </div>
                                </div>
                            </section>

                            {/* --- FOOTER --- */}
                            <footer className="bg-white pt-24 pb-16 px-12 border-t border-black/5 text-center">
                                <div className="max-w-7xl mx-auto flex flex-col items-center">
                                    <div className="w-16 h-16 bg-[#1A2F1F] rounded-2xl flex items-center justify-center text-white mb-10 shadow-2xl">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <h5 className="text-2xl font-black tracking-tighter mb-4">BlueTika Group</h5>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-16 underline decoration-[#FFD04D] decoration-2 underline-offset-8">NZ's Preferred Marketplace for Service Providers</p>
                                    <div className="w-full h-px bg-slate-100 mb-16" />
                                    <div className="flex justify-between items-center w-full text-[9px] font-black uppercase tracking-[0.2em] text-[#1A2F1F]/30">
                                        <div className="flex gap-6"><span>Terms</span><span>Privacy</span><span>Escrow</span></div>
                                        <span>© 2026 BlueTika Limited · Auckland · New Zealand</span>
                                    </div>
                                </div>
                            </footer>
                        </motion.div>
                    ) : (
                        <div className="p-20 text-center"><Bot size={64} className="mx-auto text-[#FFD04D]" /></div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}