'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-white relative">
            <div className="container px-6 mx-auto">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-serif font-bold text-ledger-charcoal mb-6"
                    >
                        One Price. <br />No Hidden Chapters.
                    </motion.h2>
                    <p className="text-lg text-ledger-charcoal/60">
                        Investing in your business growth shouldn't be complicated.
                        Get everything Kuberbook has to offer for one simple annual fee.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-xl mx-auto border-2 border-ledger-charcoal rounded-[2.5rem] p-4 bg-ledger-charcoal shadow-2xl"
                >
                    <div className="bg-white rounded-[2rem] p-10 relative overflow-hidden">
                        {/* Stamp highlight */}
                        <motion.div
                            initial={{ opacity: 0, scale: 3, rotate: -20 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: -12 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5, type: "spring", damping: 12 }}
                            className="absolute top-8 right-8 px-4 py-2 border-4 border-brand-500 rounded-xl text-brand-500 font-black text-2xl uppercase tracking-tighter -rotate-12 bg-white/80 backdrop-blur-sm z-10"
                        >
                            50% OFF
                        </motion.div>

                        <div className="flex items-center gap-2 text-brand-500 font-bold mb-4">
                            <Sparkles size={18} />
                            <span>ANNUAL BUSINESS PLAN</span>
                        </div>

                        <div className="flex items-baseline gap-4 mb-8">
                            <span className="text-5xl font-serif font-bold text-ledger-charcoal">₹10,000</span>
                            <span className="text-xl text-ledger-charcoal/30 line-through">₹20,000</span>
                            <span className="text-ledger-charcoal/50 font-medium">/ per year</span>
                        </div>

                        <p className="text-ledger-charcoal/70 mb-8 border-b border-ledger-border pb-8">
                            Everything included to run your service business at 100% efficiency.
                            No limits, no extra fees.
                        </p>

                        <ul className="space-y-4 mb-10">
                            {[
                                "Unlimited Maintenance Reminders",
                                "Full Inventory Management",
                                "Complete Financial Dashboard",
                                "Unlimited Digital Bills & Receipts",
                                "Customer History & Insights",
                                "Priority Support & Updates"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-ledger-charcoal font-medium">
                                    <div className="w-5 h-5 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-5 bg-ledger-charcoal text-white rounded-2xl font-bold text-xl hover:bg-brand-900 transition-colors shadow-lg"
                        >
                            Start Your 1-Month Free Trial
                        </motion.button>
                        <p className="text-center text-sm text-ledger-charcoal/40 mt-4">
                            No credit card required to start
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Background patterns */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-ledger-paper -z-10" />
        </section>
    );
}
