'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingCart, Users, Wallet, BarChart2, CalendarClock, FileSpreadsheet, MessageSquare, Languages } from 'lucide-react';

const screenshots = [
    { title: "Smart Dashboard", icon: LayoutDashboard, desc: "Real-time overview of your entire business pulse." },
    { title: "Inventory Management", icon: Package, desc: "Track stock levels with smart reorder point alerts." },
    { title: "Digital Billing", icon: ShoppingCart, desc: "Professional itemized bills. Support for Hindi, Marathi, & English." },
    { title: "WhatsApp Reminders", icon: MessageSquare, desc: "Send automated messages in any language. 100% customizable." },
    { title: "Multilingual Support", icon: Languages, desc: "Communicate with customers in Hindi, Marathi, or English effortlessly." },
    { title: "Customer Ledger", icon: Users, desc: "Complete purchase & service history for every client." },
    { title: "Expense Tracking", icon: Wallet, desc: "Monitor transport, rent, and overhead costs effortlessly." },
    { title: "Pulse Analytics", icon: BarChart2, desc: "Visual trends to help you stock up for busy seasons." },
    { title: "Service Schedule", icon: CalendarClock, desc: "Automated queue for today's maintenance calls." },
    { title: "P&L Statements", icon: FileSpreadsheet, desc: "Professional reports for your CA or for personal review." },
];

export function AppShowcase() {
    return (
        <section className="py-24 bg-white relative">
            <div className="container px-6 mx-auto">
                <div className="max-w-3xl mx-auto text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-ledger-charcoal mb-6">Explore the MVP</h2>
                    <p className="text-lg text-ledger-charcoal/60">Take a peek inside the command center built for your business growth.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {screenshots.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group cursor-help"
                        >
                            <div className="aspect-[4/5] bg-ledger-paper rounded-[2rem] border border-ledger-border overflow-hidden shadow-sm group-hover:shadow-ledger transition-all relative flex flex-col p-5">
                                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-brand-500 mb-4 shadow-sm">
                                    <item.icon size={20} />
                                </div>

                                <h3 className="font-bold text-sm text-ledger-charcoal mb-1">{item.title}</h3>
                                <p className="text-[10px] text-ledger-charcoal/50 leading-tight mb-auto">
                                    {item.desc}
                                </p>

                                {/* Aesthetic UI Mockup Placeholder */}
                                <div className="w-full h-24 bg-white rounded-xl border border-ledger-border p-3 space-y-1.5 mt-3 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                                    <div className="h-1.5 w-1/2 bg-ledger-paper rounded" />
                                    <div className="h-6 w-full bg-ledger-paper/50 rounded flex items-center justify-between px-2">
                                        <div className="h-3 w-3 rounded-full bg-brand-500/20" />
                                        <div className="h-1.5 w-12 bg-brand-500/20 rounded" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                                        <div className="h-8 bg-ledger-paper/30 rounded" />
                                        <div className="h-8 bg-ledger-paper/30 rounded" />
                                    </div>
                                </div>

                                <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
