'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const loginButtonRef = useRef<HTMLAnchorElement>(null);

    const navLinks = [
        { name: 'MVP', href: '#mvp-showcase' },
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'About', href: '#about' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between w-full max-w-6xl px-6 py-3 border rounded-full bg-ledger-paper/60 backdrop-blur-md border-ledger-border shadow-ledger"
            >
                <Link href="/" className="text-2xl font-serif font-bold tracking-tight text-ledger-charcoal">
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

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-ledger-charcoal hover:text-brand-500 transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Link
                        href="/login"
                        className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-ledger-charcoal/60 hover:text-ledger-charcoal transition-all"
                    >
                        Login
                    </Link>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link
                            href="/get-started"
                            className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white transition-all rounded-full bg-ledger-charcoal hover:bg-brand-900 shadow-md"
                        >
                            <span className="hidden xs:inline">Book a Demo</span>
                            <span className="xs:hidden">Demo</span>
                        </Link>
                    </motion.div>
                </div>
            </motion.div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-[88px] left-0 right-0 z-40 md:hidden"
                    >
                        <div className="mx-6 bg-white/95 backdrop-blur-md border border-ledger-border rounded-2xl shadow-lg overflow-hidden">
                            <div className="flex flex-col p-4">
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block py-3 px-4 text-base font-medium text-ledger-charcoal hover:bg-brand-50 hover:text-brand-600 rounded-lg transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
