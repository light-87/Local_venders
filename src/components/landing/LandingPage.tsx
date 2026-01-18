'use client';

import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { MaintenanceShowcase } from './MaintenanceShowcase';
import { Features } from './Features';
import { ComparisonTable } from './ComparisonTable';
import { AppShowcase } from './AppShowcase';
import { PaymentFeature } from './PaymentFeature';
import { Pricing } from './Pricing';
import { motion } from 'framer-motion';

export default function LandingPage() {
    return (
        <main className="relative">
            <Navbar />
            <Hero />
            <MaintenanceShowcase />
            <Features />
            <AppShowcase />
            <PaymentFeature />
            <ComparisonTable />
            <Pricing />

            {/* About / Founder Section */}
            <section id="about" className="py-24 bg-ledger-paper/30 relative overflow-hidden">
                <div className="container px-6 mx-auto">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-ledger-charcoal mb-8 tracking-tight">
                                The Vision Behind Kuberbook
                            </h2>
                            <p className="text-xl text-ledger-charcoal/70 mb-8 leading-relaxed font-medium">
                                I built Kuberbook with a simple mission: to empower independent vendors with the same professional tools used by big corporations. After seeing many business owners struggle with paper diaries and missed maintenance calls, I knew there had to be a better way.
                            </p>
                            <div className="space-y-6">
                                <p className="text-lg text-ledger-charcoal/60 leading-relaxed italic">
                                    "Kuberbook isn't just an app; it's your business partner. It's designed to be simple, aesthetic, and incredibly powerful. Welcome to the new era of business documentation."
                                </p>
                                <div className="pt-6 border-t border-ledger-border/40 inline-block px-12">
                                    <p className="font-bold text-2xl text-ledger-charcoal">Vaibhav</p>
                                    <p className="text-ledger-charcoal/40 text-sm font-bold uppercase tracking-widest mt-1">Founder, Kuberbook</p>
                                    <p className="text-brand-600/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2">A Product of Rajaram and Pallavi</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Basic Footer */}
            <footer className="py-12 border-t border-ledger-border bg-white text-center">
                <div className="container px-6 mx-auto">
                    <p className="text-2xl font-serif font-bold text-ledger-charcoal mb-4">Kuberbook<span className="text-brand-500">.</span></p>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8 text-sm font-medium text-ledger-charcoal/60">
                        <a href="#" className="hover:text-brand-500">Terms</a>
                        <a href="#" className="hover:text-brand-500">Privacy</a>
                        <a href="https://wa.me/918975706582" className="hover:text-brand-500">Support: +91 89757 06582</a>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-ledger-charcoal/40 font-medium">
                            A product of <span className="text-ledger-charcoal/60 font-bold">Rajaram and Pallavi</span>
                        </p>
                        <p className="text-xs text-ledger-charcoal/30">
                            © {new Date().getFullYear()} Kuberbook. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
