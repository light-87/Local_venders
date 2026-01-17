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
            <ComparisonTable />
            <PaymentFeature />
            <Pricing />

            {/* About Section */}
            <section id="about" className="py-24 bg-ledger-paper relative">
                <div className="container px-6 mx-auto">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-16">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-white p-4 shadow-ledger rotate-3 shrink-0 overflow-hidden"
                        >
                            {/* Profile Image Placeholder */}
                            <div className="w-full h-full bg-brand-100 rounded-2xl flex items-center justify-center text-brand-500 font-serif text-6xl">
                                K
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl font-serif font-bold text-ledger-charcoal mb-6">The Face Behind Kuberbook</h2>
                            <p className="text-lg text-ledger-charcoal/70 mb-6 leading-relaxed">
                                I built Kuberbook with a simple mission: to empower independent vendors with the same professional tools used by big corporations. After seeing many business owners struggle with paper diaries and missed maintenance calls, I knew there had to be a better way.
                            </p>
                            <p className="text-lg text-ledger-charcoal/70 mb-8 leading-relaxed">
                                Kuberbook isn't just an app; it's your business partner. It's designed to be simple, aesthetic, and incredibly powerful. Welcome to the new era of business documentation.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="text-ledger-charcoal">
                                    <p className="font-bold text-xl">Vaibhav</p>
                                    <p className="text-ledger-charcoal/50">Founder, Kuberbook</p>
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
                    <div className="flex justify-center gap-8 mb-8 text-sm font-medium text-ledger-charcoal/60">
                        <a href="#" className="hover:text-brand-500">Terms</a>
                        <a href="#" className="hover:text-brand-500">Privacy</a>
                        <a href="#" className="hover:text-brand-500">Contact</a>
                    </div>
                    <p className="text-sm text-ledger-charcoal/30">
                        © {new Date().getFullYear()} Kuberbook. All rights reserved.
                    </p>
                </div>
            </footer>
        </main>
    );
}
