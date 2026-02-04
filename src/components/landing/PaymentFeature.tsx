import Link from 'next/link';
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

                            <Link
                                href="/get-started"
                                className="inline-flex items-center gap-3 text-lg font-bold text-brand-500 group"
                            >
                                Learn how it works <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </div>

                    <div className="flex-1 relative w-full py-8 sm:py-12">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-12 lg:gap-16">
                            {/* Main Screenshot - Payment Request */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="relative z-10 bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-ledger-border overflow-hidden ring-4 ring-white/50 w-full max-w-[280px] sm:max-w-[300px]"
                            >
                                <img
                                    src="/screenshots/optimized/2.webp"
                                    alt="UPI Payment Request"
                                    className="w-full h-auto block"
                                    loading="lazy"
                                />
                            </motion.div>

                            {/* Background Screenshot - Digital Invoice */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                                className="relative z-20 w-full max-w-[280px] bg-white rounded-2xl shadow-2xl border border-ledger-border overflow-hidden ring-4 ring-white md:-ml-8 lg:-ml-12"
                            >
                                <img
                                    src="/screenshots/optimized/1.webp"
                                    alt="Digital Invoice"
                                    className="w-full h-auto block"
                                    loading="lazy"
                                />
                            </motion.div>
                        </div>

                        {/* Decorative element */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-100 rounded-full blur-[120px] opacity-20 -z-10" />
                    </div>
                </div>
            </div>
        </section>
    );
}
