'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: 'MVP', href: '#mvp-showcase' },
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'About', href: '#about' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 md:p-6">
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between w-full max-w-6xl px-4 md:px-6 py-3 border rounded-full bg-ledger-paper/90 backdrop-blur-md border-ledger-border shadow-ledger"
            >
                <Link href="/" className="text-xl md:text-2xl font-serif font-bold tracking-tight text-ledger-charcoal">
                    Kuberbook<span className="text-brand-500">.</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="relative text-sm font-medium text-ledger-charcoal/70 transition-colors hover:text-ledger-charcoal"
                            onMouseEnter={() => setHoveredLink(link.name)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            {link.name}
                            {hoveredLink === link.name && (
                                <motion.div
                                    layoutId="nav-underline"
                                    className="absolute -bottom-1 left-0 right-0 h-px bg-brand-500"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <Link
                        href="/login"
                        className="px-4 py-2 text-sm font-semibold text-ledger-charcoal/60 hover:text-ledger-charcoal transition-all"
                    >
                        Vendor Login
                    </Link>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link
                            href="/get-started"
                            className="px-6 py-2 text-sm font-semibold text-white transition-all rounded-full bg-ledger-charcoal hover:bg-brand-900 shadow-md"
                        >
                            Book a Demo
                        </Link>
                    </motion.div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-ledger-charcoal"
                    aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </motion.div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed md:hidden top-20 left-4 right-4 bg-ledger-paper/95 backdrop-blur-lg border border-ledger-border rounded-2xl shadow-xl p-6 z-40"
                    >
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-lg font-medium text-ledger-charcoal/70 hover:text-ledger-charcoal py-2 border-b border-ledger-border/50"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-3 pt-4">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-3 text-center text-base font-semibold text-ledger-charcoal border border-ledger-border rounded-full hover:bg-ledger-border/20 transition-all"
                                >
                                    Vendor Login
                                </Link>
                                <Link
                                    href="/get-started"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-3 text-center text-base font-semibold text-white rounded-full bg-ledger-charcoal hover:bg-brand-900 shadow-md transition-all"
                                >
                                    Book a Demo
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
