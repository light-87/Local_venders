'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

export function Navbar() {
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);
    const loginButtonRef = useRef<HTMLAnchorElement>(null);

    const navLinks = [
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

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Link
                        href="/login"
                        className="px-6 py-2 text-sm font-semibold text-white transition-all rounded-full bg-ledger-charcoal hover:bg-brand-900 shadow-md"
                    >
                        Vendor Login
                    </Link>
                </motion.div>
            </motion.div>
        </nav>
    );
}
