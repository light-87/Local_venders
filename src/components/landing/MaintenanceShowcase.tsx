import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, IndianRupee, BellRing, ArrowRight } from 'lucide-react';

export function MaintenanceShowcase() {
    return (
        <section className="py-24 bg-white relative overflow-hidden ring-1 ring-ledger-border">
            <div className="container px-6 mx-auto">
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mb-6">
                                <BellRing size={14} />
                                <span>OUR MOST LOVED FEATURE</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-ledger-charcoal mb-8 leading-tight">
                                Capture 100% of Your <br />
                                Maintenance Revenue
                            </h2>
                            <p className="text-lg text-ledger-charcoal/60 mb-10 leading-relaxed">
                                Most vendors lose up to ₹50,000 annually simply by forgetting service dates. Kuberbook automatically tracks every filter change, AC service, and warranty expiry for you.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                <div className="p-6 rounded-2xl bg-ledger-paper/50 border border-ledger-border">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm mb-4">
                                        <Calendar size={20} />
                                    </div>
                                    <h4 className="font-bold mb-2">Auto-Scheduling</h4>
                                    <p className="text-sm text-ledger-charcoal/50">Next service is scheduled the moment you close a sale.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-ledger-paper/50 border border-ledger-border">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm mb-4">
                                        <MessageSquare size={20} />
                                    </div>
                                    <h4 className="font-bold mb-2">WhatsApp Magic</h4>
                                    <p className="text-sm text-ledger-charcoal/50">One tap to send a professional, personalized reminder message.</p>
                                </div>
                            </div>

                            <Link
                                href="/get-started"
                                className="inline-flex items-center gap-3 text-lg font-bold text-brand-500 group"
                            >
                                See how it recovers lost sales <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </div>

                    <div className="flex-1 relative w-full py-8 sm:py-12">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-12 lg:gap-16">
                            {/* Main App Screen - Reminders */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="relative z-10 bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-ledger-border overflow-hidden ring-4 ring-white/50 w-full max-w-[280px] sm:max-w-[300px]"
                            >
                                <Image
                                    src="/screenshots/edited/12.jpeg"
                                    alt="Service Reminders Dashboard"
                                    width={300}
                                    height={650}
                                    className="w-full h-auto block"
                                    loading="lazy"
                                    quality={85}
                                />
                            </motion.div>

                            {/* WhatsApp Message - Beside the app on larger screens, below on mobile */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative z-20 w-full max-w-[280px] bg-white rounded-2xl shadow-2xl border border-ledger-border overflow-hidden ring-4 ring-white md:-ml-0 lg:-ml-8"
                            >
                                <div className="bg-[#075e54] p-3 text-white text-[10px] font-bold flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-white/20" />
                                    <span>WhatsApp Reminder Details</span>
                                </div>
                                <Image
                                    src="/screenshots/edited/9.png"
                                    alt="Health-Focused Maintenance Alert"
                                    width={280}
                                    height={600}
                                    className="w-full h-auto block"
                                    loading="lazy"
                                    quality={85}
                                />
                            </motion.div>
                        </div>

                        {/* Background flourish - hidden on mobile for performance */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-100 rounded-full blur-[120px] opacity-20 -z-10 hidden md:block" />
                    </div>
                </div>
            </div>
        </section>
    );
}
