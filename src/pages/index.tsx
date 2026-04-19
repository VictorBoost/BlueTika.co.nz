import { ShoppingBag, ShieldCheck, ArrowRight, Zap, Globe, CreditCard } from 'lucide-react';

export default function PremiumMarketplace() {
    return (
        <div className="min-h-screen bg-[#fcfaf8] text-[#0a0a0a] font-sans">
            {/* 1. PREMIUM HEADER */}
            <nav className="px-12 py-8 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-black/5 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#0a0a0a] rounded-2xl flex items-center justify-center text-white shadow-2xl">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tighter text-[#0a0a0a]">BlueTika <span className="text-blue-600 font-serif italic">Premium</span></h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40 italic">New Zealand's Premier Escrow</span>
                        </div>
                    </div>
                </div>
                <button className="text-[10px] font-bold uppercase bg-black text-white px-8 py-3 rounded-2xl hover:bg-blue-600 transition-all shadow-lg">Post Project</button>
            </nav>

            {/* 2. HERO / BENTO GRID */}
            <main className="max-w-7xl mx-auto p-12">
                <div className="grid grid-cols-12 gap-6 mb-12">
                    {/* BIG HERO CARD */}
                    <div className="col-span-12 lg:col-span-12 p-16 bg-white rounded-[4rem] border border-black/5 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
                            <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={400} strokeWidth={0.5} />
                        </div>
                        <div className="relative z-10 max-w-2xl">
                            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest mb-10 border border-blue-100">
                                <ShieldCheck size={16} /> 100% Anti-Fraud Guarantee
                            </div>
                            <h3 className="text-7xl font-medium tracking-tight mb-8 leading-tight">Hire with <span className="italic font-serif text-blue-600">total confidence</span>.</h3>
                            <p className="text-xl text-gray-500 mb-12 leading-relaxed">The only NZ marketplace with bank-grade escrow protection built directly into every transaction.</p>
                            <div className="flex gap-4">
                                <button className="bg-[#0a0a0a] text-white px-12 py-6 rounded-[2rem] font-bold uppercase tracking-widest text-xs shadow-2xl hover:bg-blue-700 transition-all">Start Project</button>
                                <button className="bg-white border border-black/20 px-12 py-6 rounded-[2rem] font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-all">Browse Talent</button>
                            </div>
                        </div>
                    </div>

                    {/* STAT CARD */}
                    <div className="col-span-12 md:col-span-8 p-12 bg-[#0a0a0a] text-white rounded-[3.5rem] shadow-2xl flex flex-col justify-between group cursor-pointer hover:bg-blue-900 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
                                <CreditCard size={36} />
                            </div>
                            <Zap className="text-blue-400 opacity-20 group-hover:opacity-100 transition-all" size={28} />
                        </div>
                        <div>
                            <p className="text-[12px] uppercase tracking-[0.4em] font-medium opacity-50 mb-4 italic">Unified Wallet Sync</p>
                            <h4 className="text-6xl font-black tracking-tighter mb-4">$4,120 <span className="text-3xl font-normal opacity-40">NZD</span></h4>
                            <div className="flex items-center gap-3 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" /> Connected to .nz Infrastructure
                            </div>
                        </div>
                    </div>

                    {/* VERIFIED INFO CARD */}
                    <div className="col-span-12 md:col-span-4 p-12 bg-white border border-black/5 rounded-[4rem] flex flex-col items-center justify-center text-center shadow-xl">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600 shadow-inner">
                            <ShieldCheck size={48} strokeWidth={1} />
                        </div>
                        <h4 className="font-bold text-2xl mb-4 pr pr pr pr">Verified Talent</h4>
                        <p className="text-[11px] text-gray-400 max-w-[18ch] mx-auto leading-relaxed uppercase tracking-widest font-black">Only high-performance Kiwi experts pass our vetting.</p>
                    </div>
                </div>
            </main>

            <footer className="px-12 py-10 text-center opacity-30 text-[10px] font-bold uppercase tracking-[0.3em] flex flex-col gap-4">
                <div>BlueTika Marketplace · Established 2026</div>
                <div className="flex justify-center gap-4">
                    <span>Terms</span><span>Privacy</span><span>NZ Owned</span>
                </div>
            </footer>
        </div>
    );
}