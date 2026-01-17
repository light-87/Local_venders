'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Opening book animation
            gsap.fromTo(
                bookRef.current,
                { rotateY: -90, opacity: 0, scale: 0.8 },
                {
                    rotateY: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 1.5,
                    ease: "back.out(1.2)"
                }
            );

            // Parallax effect on title
            gsap.to(titleRef.current, {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                },
                y: 100,
                opacity: 0.5
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative min-h-[110vh] flex flex-col items-center justify-center pt-32 overflow-hidden bg-ledger-paper"
        >
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-brand-500 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-brand-500 blur-[120px]" />
            </div>

            <div className="container relative z-10 px-6 mx-auto text-center max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase border rounded-full border-ledger-border text-ledger-charcoal/60 bg-white/50">
                        The Professional Partner for Growing Businesses
                    </span>
                </motion.div>

                <h1
                    ref={titleRef}
                    className="relative text-6xl md:text-8xl font-serif font-bold leading-[1.1] text-ledger-charcoal mb-8"
                >
                    Your Business, <br />
                    <span className="relative inline-block">
                        Documented
                        <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 20" preserveAspectRatio="none">
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
                                d="M5,15 Q100,5 200,15 T395,15"
                                fill="transparent"
                                stroke="#D97757"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </svg>
                    </span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="max-w-2xl mx-auto text-lg md:text-xl text-ledger-charcoal/70 mb-12 leading-relaxed"
                >
                    Transition from regular paper chaos to digital clarity.
                    The first business command center built specifically for independent service vendors.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                >
                    <button className="px-8 py-4 text-lg font-bold text-white transition-all rounded-full bg-ledger-charcoal hover:bg-brand-900 shadow-xl hover:shadow-brand-500/20 active:scale-95">
                        Start 1-Month Free Trial
                    </button>
                    <button className="px-8 py-4 text-lg font-bold text-ledger-charcoal transition-all rounded-full border-2 border-ledger-charcoal/10 hover:bg-ledger-charcoal/5 active:scale-95">
                        Watch Pitch Video
                    </button>
                </motion.div>

                {/* 3D Ledger Visual Placeholder */}
                <div
                    ref={bookRef}
                    className="relative w-full max-w-4xl mx-auto aspect-[16/9] bg-white rounded-lg shadow-2xl border border-ledger-border perspective-2000"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-white to-ledger-paper">
                        {/* Simple representation of dashboard */}
                        <div className="w-[85%] h-[80%] border border-ledger-border rounded shadow-sm bg-white p-6 text-left">
                            <div className="flex justify-between items-center mb-8">
                                <div className="h-6 w-32 bg-ledger-paper rounded" />
                                <div className="h-8 w-8 rounded-full bg-brand-500" />
                            </div>
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-ledger-paper rounded-lg p-4">
                                        <div className="h-3 w-16 bg-ledger-charcoal/10 rounded mb-2" />
                                        <div className="h-6 w-20 bg-ledger-charcoal/20 rounded" />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-12 bg-ledger-paper rounded flex items-center px-4 gap-4">
                                        <div className="h-6 w-6 rounded bg-brand-500/20" />
                                        <div className="h-3 w-full bg-ledger-charcoal/10 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* The "Paper" Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                    </div>
                </div>
            </div>
        </section>
    );
}
