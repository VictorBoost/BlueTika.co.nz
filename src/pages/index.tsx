import Head from 'next/head';
import { Search, ShieldCheck, ArrowRight, Zap, Globe, Award, Users, Leaf, Waves, Briefcase, Handshake } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-[#F8F5F2] text-[#1A2F1F] font-sans selection:bg-[#FFD04D]">
            <Head>
                <title>BlueTika - Projects & Contracts for Aotearoa</title>
                <meta name="description" content="New Zealand's trusted marketplace connecting Clients with Service Providers." />
            </Head>

            {/* 1. NAVIGATION BAR */}
            <nav className="px-12 py-6 flex justify-between items-center bg-white border-b border-black/5 sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1A2F1F] rounded-xl flex items-center justify-center text-white font-black italic">B</div>
                    <h1 className="text-xl font-bold tracking-tighter">BlueTika</h1>
                </div>
                <div className="flex items-center gap-8">
                    <nav className="hidden lg:flex gap-8 text-[11px] font-bold uppercase tracking-widest opacity-60">
                        <span className="hover:text-blue-600 cursor-pointer">Post a Project</span>
                        <span className="hover:text-blue-600 cursor-pointer">Browse Projects</span>
                        <span className="hover:text-blue-600 cursor-pointer">My Contracts</span>
                    </nav>
                    <button className="bg-[#1A2F1F] text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#FFD04D] hover:text-[#1A2F1F] transition-all">Member Login</button>
                </div>
            </nav>

            {/* 2. AIRTASKER STYLE HERO SECTION */}
            <header className="bg-[#1A2F1F] text-white py-32 px-12 text-center relative overflow-hidden">
                {/* Subtle Māori-inspired background glow */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:40px_40px]" />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-8 border border-white/5">
                        <ShieldCheck size={14} className="text-[#FFD04D]" /> 100% NZ Owned & Managed Whānau
                    </div>
                    <h2 className="text-8xl font-black tracking-tighter mb-8 leading-[0.9] font-serif">Projects made easy. <br /><span className="italic text-[#FFD04D]">Contracts secured.</span></h2>
                    <p className="text-xl text-white/60 mb-12 max-w-xl mx-auto font-medium">Connecting Kiwi <span className="text-white">Clients</span> with verified <span className="text-white">Service Providers</span>. Your funds are held in escrow until the contract is complete.</p>

                    {/* Main Search Bar */}
                    <div className="bg-white rounded-[2.5rem] p-3 flex flex-col md:flex-row gap-2 shadow-2xl max-w-2xl mx-auto transform translate-y-4">
                        <div className="flex-[1.5] flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-[2rem] text-slate-800">
                            <Search size={22} className="opacity-30" />
                            <input type="text" placeholder="What project do you need a hand with?" className="bg-transparent border-none outline-none w-full text-lg font-medium" />
                        </div>
                        <button className="bg-[#FFD04D] text-[#1A2F1F] px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-lg active:scale-95">Search Projects</button>
                    </div>
                </div>
            </header>

            {/* 3. WORKFLOW: FROM PROJECT TO CONTRACT */}
            <section className="py-32 px-12 bg-white text-center">
                <div className="max-w-6xl mx-auto">
                    <h3 className="text-4xl font-bold mb-4">The BlueTika Way</h3>
                    <p className="text-slate-400 mb-20 max-w-md mx-auto italic uppercase tracking-[0.2em] text-xs font-bold font-black">How we protect your Whānau & business</p>

                    <div className="grid md:grid-cols-3 gap-16 relative">
                        {/* Decorative arrow between steps */}
                        <div className="hidden lg:block absolute top-10 left-[30%] w-[100px] h-px border-t-2 border-dashed border-[#1A2F1F]/10" />
                        <div className="hidden lg:block absolute top-10 right-[30%] w-[100px] h-px border-t-2 border-dashed border-[#1A2F1F]/10" />

                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 border border-black/5 rounded-full flex items-center justify-center text-[#1A2F1F] mb-8 shadow-inner">
                                <Briefcase size={32} />
                            </div>
                            <h4 className="font-black text-xs uppercase tracking-widest mb-4">1. Post a Project</h4>
                            <p className="text-sm text-slate-500 max-w-[20ch]">Clients describe their project and set an NZD budget.</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 border border-black/5 rounded-full flex items-center justify-center text-[#1A2F1F] mb-8 shadow-inner">
                                <Handshake size={32} />
                            </div>
                            <h4 className="font-black text-xs uppercase tracking-widest mb-4">2. Bids & Offers</h4>
                            <p className="text-sm text-slate-500 max-w-[20ch]">Service Providers bid on the project and chat with you.</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-[#FFD04D] rounded-full flex items-center justify-center text-[#1A2F1F] mb-8 shadow-xl">
                                <ShieldCheck size={32} />
                            </div>
                            <h4 className="font-black text-xs uppercase tracking-widest mb-4">3. Legal Contract</h4>
                            <p className="text-sm font-bold text-[#1A2F1F] leading-tight max-w-[20ch]">The deal becomes a Contract once funds are in Escrow.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. TIKANGA: TRUST & CULTURE */}
            <section className="bg-[#1A2F1F] text-white py-32 px-12 overflow-hidden relative">
                {/* Background Fern Decoration */}
                <Leaf size={600} className="absolute -right-40 bottom-0 text-white/[0.03] rotate-45 pointer-events-none" />

                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
                    <div className="relative group">
                        <div className="absolute -inset-10 bg-[#FFD04D] rounded-[4rem] opacity-10 blur-3xl pointer-events-none" />
                        <div className="rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl transform hover:rotate-2 transition-transform duration-700">
                            <img src="https://picsum.photos/seed/nz-professional/800/1000" className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-700" alt="NZ Trusted Pro" referrerPolicy="no-referrer" />
                        </div>
                        <div className="absolute bottom-10 left-10 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 text-sm font-bold uppercase tracking-widest">
                            Kia Ora Aotearoa
                        </div>
                    </div>

                    <div className="text-left">
                        <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#FFD04D] mb-6 flex items-center gap-3">
                            <Waves size={16} /> Our Values / Tikanga
                        </div>
                        <h3 className="text-6xl font-medium tracking-tighter mb-10 font-serif leading-tight">Built on the foundation of <span className="italic text-[#FFD04D]">Manaakitanga</span>.</h3>

                        <div className="space-y-12">
                            <div className="flex gap-8 group">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#FFD04D] border border-white/10 group-hover:bg-[#FFD04D] group-hover:text-[#1A2F1F] transition-all"><Users size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl mb-3 pr pr pr pr pr">Verified Service Providers</h4>
                                    <p className="text-white/50 leading-relaxed text-sm">Every provider is vetted and identity-verified to ensure community safety.</p>
                                </div>
                            </div>
                            <div className="flex gap-8 group">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#FFD04D] border border-white/10 group-hover:bg-[#FFD04D] group-hover:text-[#1A2F1F] transition-all"><Award size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl mb-3 pr pr pr pr pr">Client Deposit Protection</h4>
                                    <p className="text-white/50 leading-relaxed text-sm">We hold project funds securely. Only release them when the project requirements are met.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. FOOTER */}
            <footer className="pt-24 pb-12 px-12 bg-white text-center">
                <div className="max-w-6xl mx-auto flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 border border-black/5 opacity-50">
                        <ShoppingBag size={24} />
                    </div>
                    <h5 className="text-2xl font-bold mb-4">BlueTika Group</h5>
                    <p className="text-slate-400 text-sm mb-12 uppercase tracking-widest font-bold">New Zealand's Trusted Service Marketplace</p>

                    <div className="w-full h-px bg-black/5 mb-12" />

                    <div className="flex flex-col md:flex-row justify-between items-center w-full gap-8 text-[10px] font-black uppercase tracking-widest opacity-30">
                        <div className="flex gap-10">
                            <span>Terms of Service</span>
                            <span>Privacy Policy</span>
                            <span>Fees & Trust</span>
                        </div>
                        <span>© 2026 BlueTika Limited. Proudly 100% NZ Owned.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}