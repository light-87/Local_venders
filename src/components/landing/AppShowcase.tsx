'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingCart, Users, CalendarClock, MessageSquare } from 'lucide-react';

const screenshots = [
    { id: 'dashboard', title: "Business Dashboard", icon: LayoutDashboard, desc: "A total overhead view of your daily sales and service pulse.", img: "/screenshots/edited/11.png" },
    { id: 'inventory', title: "Intelligent Inventory", icon: Package, desc: "Live stock tracking with automatic low-balance reorder alerts.", img: "/screenshots/edited/10.png" },
    { id: 'billing', title: "Professional Invoicing", icon: ShoppingCart, desc: "Send polished digital bills via WhatsApp in under 30 seconds.", img: "/screenshots/edited/1.png" },
    { id: 'reminders', title: "Automated Reminders", icon: MessageSquare, desc: "Set-and-forget WhatsApp alerts that bring customers back.", img: "/screenshots/edited/9.png" },
    { id: 'ledger', title: "Customer Journals", icon: Users, desc: "Every purchase and service history organized for every client.", img: "/screenshots/edited/6.png" },
    { id: 'schedule', title: "Service Pipelines", icon: CalendarClock, desc: "A streamlined queue for managing today's maintenance calls.", img: "/screenshots/edited/12.jpeg" },
];

export function AppShowcase() {
    return (
        <section id="mvp-showcase" className="py-24 bg-ledger-paper/30 relative">
            <div className="container px-6 mx-auto">
                <div className="max-w-3xl mx-auto text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-ledger-charcoal mb-6">Explore the MVP</h2>
                    <p className="text-lg text-ledger-charcoal/60">Every screen is designed for maximum clarity and effortless business growth.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
                    {screenshots.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (index % 3) * 0.1 }}
                            className="flex flex-col group max-w-[280px] mx-auto"
                        >
                            <div className="bg-white rounded-3xl shadow-ledger-lg border border-ledger-border overflow-hidden ring-4 ring-white/50 transition-all duration-500 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] group-hover:-translate-y-2">
                                <Image
                                    src={item.img}
                                    alt={item.title}
                                    width={280}
                                    height={600}
                                    className="w-full h-auto block"
                                    loading="lazy"
                                    quality={85}
                                />
                            </div>

                            <div className="mt-6 px-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-1.5 rounded-lg bg-brand-500 text-white shadow-sm">
                                        <item.icon size={16} />
                                    </div>
                                    <h3 className="text-lg font-bold text-ledger-charcoal">{item.title}</h3>
                                </div>
                                <p className="text-ledger-charcoal/60 leading-relaxed text-sm">
                                    {item.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="container px-6 mx-auto mt-32">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-[2.5rem] shadow-ledger-xl border border-ledger-border overflow-hidden"
                    >
                        <div className="p-8 md:p-12 border-b border-ledger-border bg-gradient-to-br from-white to-ledger-paper">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-ledger-charcoal mb-2">Pulse Analytics</h3>
                                    <p className="text-ledger-charcoal/60">The complete high-level view of your business performance and trends.</p>
                                </div>
                                <div className="px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-xs font-bold self-start border border-brand-100 uppercase tracking-wider">
                                    Deep Insights
                                </div>
                            </div>
                        </div>
                        <div className="relative aspect-[16/9] md:aspect-[16/7] bg-ledger-paper/30 overflow-hidden">
                            <Image
                                src="/screenshots/edited/3.png"
                                alt="Full Pulse Analytics Dashboard"
                                fill
                                className="object-cover object-top"
                                loading="lazy"
                                quality={85}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Background design elements - hidden on mobile for performance */}
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-brand-100/30 rounded-full blur-[120px] -z-10 hidden md:block" />
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-brand-100/30 rounded-full blur-[120px] -z-10 hidden md:block" />
        </section>
    );
}
