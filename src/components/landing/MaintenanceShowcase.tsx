'use client';

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

                            <motion.button
                                whileHover={{ gap: '1.25rem' }}
                                className="flex items-center gap-3 text-lg font-bold text-brand-500"
                            >
                                See how it recovers lost sales <ArrowRight size={20} />
                            </motion.button>
                        </motion.div>
                    </div>

                    <div className="flex-1 relative w-full">
                        <div className="relative z-10 bg-white rounded-3xl border border-ledger-border shadow-2xl p-8 max-w-lg mx-auto overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <BellRing size={120} />
                            </div>

                            <h3 className="font-serif text-2xl font-bold mb-6 text-ledger-charcoal border-b border-ledger-border pb-4">Service Schedule</h3>

                            <div className="space-y-4">
                                {[
                                    { name: "Ramesh Kumar", type: "Water Purifier", date: "Today", overdue: true },
                                    { name: "Suresh Singh", type: "AC Maintenance", date: "Tomorrow", overdue: false },
                                    { name: "Anita Devi", type: "Chimney Cleaning", date: "18 Jan", overdue: false },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.2 }}
                                        className="flex items-center justify-between p-4 rounded-xl border border-ledger-border bg-ledger-paper/20 hover:bg-ledger-paper transition-colors"
                                    >
                                        <div>
                                            <p className="font-bold text-ledger-charcoal">{item.name}</p>
                                            <p className="text-xs text-ledger-charcoal/50">{item.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-xs font-bold ${item.overdue ? 'text-red-500' : 'text-brand-500'}`}>{item.date}</p>
                                            <button className="mt-1 px-3 py-1 bg-ledger-charcoal text-white text-[10px] rounded-lg font-bold uppercase tracking-wider">Remind</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-brand-500/10 rounded-2xl border border-brand-500/20 text-center">
                                <p className="text-sm font-medium text-brand-700">₹8,500 Estimated Revenue for this week</p>
                            </div>
                        </div>

                        {/* Background flourish */}
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-100 rounded-full blur-[80px] opacity-30 -z-10" />
                    </div>
                </div>
            </div>
        </section>
    );
}
