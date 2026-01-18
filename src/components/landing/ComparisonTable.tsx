import Link from 'next/link';
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
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="container px-6 mx-auto">
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <span className="text-brand-500 font-bold tracking-widest uppercase text-sm mb-4 block">Proven Performance</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-ledger-charcoal mb-6">The End of Business Chaos</h2>
                    <p className="text-lg text-ledger-charcoal/60">Moving your business from messy paper trails to a streamlined digital future.</p>
                </div>

                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="hidden md:grid grid-cols-2 gap-20 px-8 mb-4">
                        <div className="text-ledger-charcoal/40 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400/50" />
                            Traditional Way
                        </div>
                        <div className="text-brand-500 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-500" />
                            Kuberbook Advantage
                        </div>
                    </div>

                    <div className="space-y-6">
                        {comparisonData.map((row, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="relative"
                            >
                                {/* Mobile Header for each card */}
                                <div className="md:hidden flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-ledger-charcoal text-white flex items-center justify-center font-bold text-xs">
                                        0{i + 1}
                                    </div>
                                    <h3 className="font-bold text-ledger-charcoal text-lg">{row.feature}</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-20">
                                    {/* Traditional Column */}
                                    <div className="p-6 rounded-2xl bg-ledger-paper/30 border border-ledger-border/50 transition-all hover:bg-ledger-paper/50">
                                        <div className="md:hidden text-ledger-charcoal/40 text-[10px] font-bold uppercase tracking-widest mb-2">Traditional</div>
                                        <div className="flex items-start gap-3">
                                            <X size={18} className="text-red-400 mt-1 shrink-0" />
                                            <p className="text-ledger-charcoal/50 font-medium leading-relaxed">{row.traditional}</p>
                                        </div>
                                    </div>

                                    {/* Kuberbook Column */}
                                    <div className="p-6 rounded-2xl bg-white border-2 border-brand-500/10 shadow-ledger hover:shadow-ledger-lg transition-all relative overflow-hidden group">
                                        {/* Corner Accent */}
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-[5rem] -mr-12 -mt-12 transition-transform group-hover:scale-110" />

                                        <div className="md:hidden text-brand-500 text-[10px] font-bold uppercase tracking-widest mb-2">Kuberbook</div>
                                        <div className="flex items-start gap-3">
                                            <Check size={20} className="text-brand-500 mt-1 shrink-0" strokeWidth={3} />
                                            <div>
                                                <h4 className="hidden md:block text-xs font-bold text-brand-500/60 uppercase tracking-widest mb-1">{row.feature}</h4>
                                                <p className="text-ledger-charcoal font-bold leading-relaxed">{row.kuberbook}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Connecting line for desktop */}
                                <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-ledger border border-ledger-border flex items-center justify-center">
                                        <ArrowRight className="text-brand-500" size={16} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-20 p-12 rounded-3xl bg-ledger-charcoal text-white text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-brand-900/40 opacity-50" />
                        <div className="relative z-10">
                            <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4">Start Growing Today</h3>
                            <p className="text-white/60 mb-8 max-w-xl mx-auto">Join the new era of professional independent vendors who never lose a customer to manual errors.</p>
                            <Link
                                href="/get-started"
                                className="px-10 py-4 bg-brand-500 text-white rounded-full font-bold shadow-xl hover:bg-brand-600 transition-all inline-flex items-center gap-3 mx-auto group"
                            >
                                Start Your Free Trial <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
