'use client';

import { motion } from 'framer-motion';
import { Smartphone, CheckCircle2, ArrowRight } from 'lucide-react';

export function PaymentFeature() {
    return (
        <section className="py-24 bg-ledger-paper relative overflow-hidden">
            <div className="container px-6 mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="text-brand-500 font-bold tracking-widest uppercase text-sm mb-4 block">
                                The Modern Bill
                            </span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-ledger-charcoal mb-8 leading-tight">
                                Send professional bills. <br />
                                Get paid instantly.
                            </h2>
                            <p className="text-lg text-ledger-charcoal/60 mb-10 leading-relaxed">
                                No more messy paper receipts. Share a link that shows the complete itemized bill with warranty details. Your customers can pay you right away via Google Pay, PhonePe, or any UPI app.
                            </p>

                            <ul className="space-y-4 mb-10">
                                {[
                                    "One-tap UPI payment links",
                                    "Auto-generated PDF receipts",
                                    "Real-time payment status",
                                    "Digital warranty certificates"
                                ].map((item, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 + (i * 0.1) }}
                                        className="flex items-center gap-3 text-ledger-charcoal/80 font-medium"
                                    >
                                        <CheckCircle2 className="text-brand-500" size={20} />
                                        {item}
                                    </motion.li>
                                ))}
                            </ul>

                            <motion.button
                                whileHover={{ gap: '1.25rem' }}
                                className="flex items-center gap-3 text-lg font-bold text-brand-500"
                            >
                                Learn how it works <ArrowRight size={20} />
                            </motion.button>
                        </motion.div>
                    </div>

                    <div className="flex-1 relative">
                        <div className="relative z-10 w-full max-w-[400px] mx-auto">
                            {/* Phone Mockup */}
                            <motion.div
                                initial={{ rotateY: 20, rotateX: 10, y: 50, opacity: 0 }}
                                whileInView={{ rotateY: 0, rotateX: 0, y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="bg-ledger-charcoal p-4 rounded-[3rem] shadow-2xl border-[8px] border-ledger-charcoal relative overflow-hidden aspect-[9/19]"
                            >
                                <div className="bg-white h-full rounded-[2rem] overflow-hidden flex flex-col">
                                    {/* Mock Payment Screen */}
                                    <div className="bg-blue-600 p-6 text-white text-center">
                                        <div className="w-12 h-12 rounded-full bg-white/20 mx-auto mb-3" />
                                        <div className="h-4 w-24 bg-white/20 rounded mx-auto mb-1" />
                                        <div className="h-2 w-16 bg-white/10 rounded mx-auto" />
                                    </div>
                                    <div className="p-6 flex-1 space-y-4">
                                        <div className="flex justify-between border-b pb-4">
                                            <div className="space-y-1">
                                                <div className="h-2 w-12 bg-gray-100 rounded" />
                                                <div className="h-3 w-20 bg-gray-200 rounded" />
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <div className="h-2 w-12 bg-gray-100 rounded ml-auto" />
                                                <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-2 w-8 bg-gray-100 rounded" />
                                            <div className="flex justify-between items-center">
                                                <div className="h-3 w-32 bg-gray-200 rounded" />
                                                <div className="h-3 w-12 bg-gray-300 rounded" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="h-3 w-24 bg-gray-200 rounded" />
                                                <div className="h-3 w-12 bg-gray-300 rounded" />
                                            </div>
                                        </div>
                                        <div className="mt-8 pt-4 border-t space-y-3">
                                            <div className="h-10 w-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg" />
                                            <div className="h-10 w-full bg-purple-600 rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Decorative "Paper Receipt" floating behind */}
                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                    rotate: [-3, 0, -3]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-10 -left-20 w-48 h-64 bg-white shadow-lg border border-ledger-border p-4 opacity-40 -z-10 rotate-[-12deg]"
                            >
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-gray-100 rounded" />
                                    <div className="h-2 w-3/4 bg-gray-100 rounded" />
                                    <div className="h-2 w-1/2 bg-gray-100 rounded" />
                                    <div className="h-2 w-full bg-gray-100 rounded pt-8" />
                                    <div className="h-2 w-3/4 bg-gray-100 rounded" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
