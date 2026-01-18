'use client';

import { motion } from 'framer-motion';
import {
    Bell,
    ShieldCheck,
    Package,
    BarChart3,
    FileText,
    Zap
} from 'lucide-react';

const features = [
    {
        title: "Auto-Reminders",
        description: "Never miss a service call. One-tap professional WhatsApp reminders for your customers.",
        icon: Bell,
        color: "bg-blue-50 text-blue-600"
    },
    {
        title: "Warranty Tracking",
        description: "Instant status for every item sold. No more searching through paper receipts.",
        icon: ShieldCheck,
        color: "bg-green-50 text-green-600"
    },
    {
        title: "Smart Inventory",
        description: "Real-time stock levels with intelligent reorder suggestions based on your sales.",
        icon: Package,
        color: "bg-amber-50 text-amber-600"
    },
    {
        title: "Financial Clarity",
        description: "Complete P&L dashboard. Know exactly where your money is going every single month.",
        icon: BarChart3,
        color: "bg-purple-50 text-purple-600"
    },
    {
        title: "Professional Bills",
        description: "Send shareable digital bills in 30 seconds. Includes payment links and itemized details.",
        icon: FileText,
        color: "bg-rose-50 text-rose-600"
    },
    {
        title: "Pulse Analytics",
        description: "See your business growth trends and seasonal patterns at a single glance.",
        icon: Zap,
        color: "bg-indigo-50 text-indigo-600"
    }
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-white relative overflow-hidden">
            <div className="container px-6 mx-auto">
                <div className="max-w-3xl mx-auto text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-serif font-bold text-ledger-charcoal mb-6"
                    >
                        The Command Center for <br />
                        Independent Service Vendors
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-ledger-charcoal/60"
                    >
                        Everything you need to capture 100% of your maintenance revenue,
                        packaged into a beautiful digital journal.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="p-8 border border-ledger-border rounded-2xl bg-ledger-paper/30 hover:bg-white hover:shadow-ledger transition-all group"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <feature.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-ledger-charcoal mb-3">{feature.title}</h3>
                            <p className="text-ledger-charcoal/60 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Background flourish */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-brand-100 rounded-full blur-[100px] opacity-20 -z-10" />
        </section>
    );
}
