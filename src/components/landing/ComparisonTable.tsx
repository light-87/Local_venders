'use client';

import { motion } from 'framer-motion';
import { X, Check, ArrowRight } from 'lucide-react';

const comparisonData = [
    {
        feature: "Maintenance Alerts",
        traditional: "Paper diary, often forgotten",
        kuberbook: "Automatic WhatsApp Reminders",
        status: true
    },
    {
        feature: "Warranty Checks",
        traditional: "Digging through old receipts",
        kuberbook: "One-tap instant status",
        status: true
    },
    {
        feature: "Stock Monitoring",
        traditional: "Manual counting, stock outs",
        kuberbook: "Intelligent reorder alerts",
        status: true
    },
    {
        feature: "Billing & GST",
        traditional: "Handwritten, unprofessional",
        kuberbook: "Professional digital bills (Link/PDF)",
        status: true
    },
    {
        feature: "Payment Collection",
        traditional: "Manual follow-ups, cash only",
        kuberbook: "Instant UPI Payment Links",
        status: true
    },
    {
        feature: "Financial Clarity",
        traditional: "No idea of month-end profit",
        kuberbook: "Real-time P&L Dashboard",
        status: true
    },
];

export function ComparisonTable() {
    return (
        <section className="py-24 bg-ledger-paper relative">
            <div className="container px-6 mx-auto">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-ledger-charcoal mb-6">The End of Business Chaos</h2>
                    <p className="text-lg text-ledger-charcoal/60">Compare the traditional paper-based process with the modern Kuberbook experience.</p>
                </div>

                <div className="max-w-5xl mx-auto overflow-hidden rounded-[2rem] border border-ledger-border bg-white shadow-2xl">
                    <div className="grid grid-cols-3 bg-ledger-charcoal text-white font-bold text-sm md:text-base p-6 md:p-8">
                        <div className="text-left font-serif text-xl">Operational Step</div>
                        <div className="text-center opacity-50 font-medium">Traditional Way</div>
                        <div className="text-right text-brand-500 font-serif text-xl tracking-tight">Kuberbook Way</div>
                    </div>

                    <div className="divide-y divide-ledger-border">
                        {comparisonData.map((row, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="grid grid-cols-3 p-6 md:p-8 hover:bg-ledger-paper/30 transition-colors"
                            >
                                <div className="text-left font-bold text-ledger-charcoal">{row.feature}</div>
                                <div className="text-center text-ledger-charcoal/50 flex flex-col md:flex-row items-center justify-center gap-2">
                                    <X size={16} className="text-red-400 hidden md:block" />
                                    <span className="text-sm md:text-base">{row.traditional}</span>
                                </div>
                                <div className="text-right text-ledger-charcoal font-medium flex flex-col md:flex-row-reverse items-center justify-end gap-2">
                                    <Check size={20} className="text-brand-500 hidden md:block" strokeWidth={3} />
                                    <span className="text-sm md:text-base">{row.kuberbook}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="p-8 bg-ledger-paper/50 text-center border-t border-ledger-border">
                        <p className="text-ledger-charcoal/60 mb-6 font-medium">Ready to upgrade your business operations?</p>
                        <button className="px-10 py-4 bg-ledger-charcoal text-white rounded-full font-bold shadow-lg hover:bg-brand-900 transition-all flex items-center gap-3 mx-auto group">
                            Open Your Digital Ledger <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
