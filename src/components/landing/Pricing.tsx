'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

export function Pricing() {
    const plans = [
        {
            name: "ANNUAL BUSINESS PLAN",
            price: "₹10,000",
            originalPrice: "₹20,000",
            period: "/ per year",
            description: "Everything included to run your service business at 100% efficiency. No limits, no extra fees.",
            badge: "50% OFF",
            features: [
                "Unlimited Maintenance Reminders",
                "Full Inventory Management",
                "Complete Financial Dashboard",
                "Unlimited Digital Bills & Receipts",
                "Customer History & Insights",
                "Priority Support & Updates"
            ],
            cta: "Start Your 1-Month Free Trial",
            highlight: false
        },
        {
            name: "LIFETIME BUSINESS PLAN",
            price: "₹50,000",
            originalPrice: "₹1,00,000",
            period: "one-time payment",
            description: "Secure your business command center forever. No more renewals, no more monthly overhead. A permanent asset.",
            badge: "LIFETIME VALUE",
            features: [
                "ALL Annual Plan Features",
                "Lifetime Updates & Support",
                "Zero Renewal Fees Ever",
                "Priority Access to New Modules",
                "Personalized Onboarding",
                "Direct Whatsapp Support Line"
            ],
            cta: "Get Lifetime Access Now",
            highlight: true
        }
    ];

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
                        One Choice. <br />Permanent Growth.
                    </motion.h2>
                    <p className="text-lg text-ledger-charcoal/60">
                        Investing in your business growth should be a one-time decision, not a recurring headache.
                        Choose the plan that fits your vision.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`border-2 border-ledger-charcoal rounded-[2rem] p-3 ${plan.highlight ? 'bg-brand-500 shadow-2xl z-10' : 'bg-ledger-charcoal shadow-xl'}`}
                        >
                            <div className="bg-white rounded-[1.75rem] p-6 sm:p-8 relative h-full flex flex-col overflow-hidden">
                                {/* Stamp highlight - Optimized for mobile */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 3, rotate: -20 }}
                                    whileInView={{ opacity: 1, scale: 1, rotate: -12 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.5 + (idx * 0.1), type: "spring", damping: 12 }}
                                    className={`absolute top-4 right-4 sm:top-6 sm:right-6 px-3 py-1 border-[3px] ${plan.highlight ? 'border-ledger-charcoal text-ledger-charcoal' : 'border-brand-500 text-brand-500'} rounded-lg font-black text-xs sm:text-base uppercase tracking-tighter -rotate-12 bg-white/90 backdrop-blur-sm z-20`}
                                >
                                    {plan.badge}
                                </motion.div>

                                <div className={`flex items-center gap-2 ${plan.highlight ? 'text-ledger-charcoal' : 'text-brand-500'} font-bold mb-3`}>
                                    <Sparkles size={16} />
                                    <span className="text-xs sm:text-sm">{plan.name}</span>
                                </div>

                                <div className="flex flex-wrap items-baseline gap-2 mb-1">
                                    <span className="text-3xl sm:text-4xl font-serif font-bold text-ledger-charcoal">{plan.price}</span>
                                    <span className="text-base sm:text-lg text-ledger-charcoal/30 line-through">{plan.originalPrice}</span>
                                </div>
                                <div className="text-ledger-charcoal/50 text-xs sm:text-sm font-medium mb-6">
                                    {plan.period}
                                </div>

                                <p className="text-sm sm:text-base text-ledger-charcoal/70 mb-6 border-b border-ledger-border pb-6 flex-grow leading-relaxed">
                                    {plan.description}
                                </p>

                                <ul className="space-y-2 sm:space-y-3 mb-8">
                                    {plan.features.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-ledger-charcoal font-medium text-xs sm:text-sm">
                                            <div className="w-4 h-4 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0 mt-0.5">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/get-started"
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 group ${plan.highlight
                                        ? 'bg-brand-500 text-white hover:bg-brand-600'
                                        : 'bg-ledger-charcoal text-white hover:bg-brand-900'
                                        }`}
                                >
                                    {plan.cta} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>

                                {!plan.highlight && (
                                    <p className="text-center text-[10px] sm:text-xs text-ledger-charcoal/40 mt-3">
                                        No credit card required to start
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Background patterns */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-ledger-paper -z-10" />
        </section>
    );
}
