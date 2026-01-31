'use client';

import Link from 'next/link';
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
            className="relative min-h-[85vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden bg-ledger-paper"
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
                    <Link
                        href="/get-started"
                        className="px-8 py-4 text-lg font-bold text-white transition-all rounded-full bg-ledger-charcoal hover:bg-brand-900 shadow-xl hover:shadow-brand-500/20 active:scale-95"
                    >
                        Start 1-Month Free Trial
                    </Link>
                </motion.div>

                {/* Video / Visual Box */}
                <div
                    ref={bookRef}
                    className="relative w-full max-w-5xl mx-auto mt-20 aspect-[16/9] bg-white rounded-2xl shadow-[0_32px_72px_-16px_rgba(0,0,0,0.25)] border border-ledger-border perspective-2000 overflow-hidden"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white to-ledger-paper">
                        <div className="flex flex-col items-center gap-4 p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-white shadow-lg animate-pulse">
                                <svg className="w-10 h-10 translate-x-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-ledger-charcoal">Pitch Video Preview</h3>
                            <p className="text-ledger-charcoal/40 max-w-md">The complete video walkthrough is being finalized. Stay tuned for the definitive business command center tour.</p>
                        </div>

                        {/* The "Paper" Texture Overlay - subtle noise effect */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-gradient-to-br from-gray-100 to-transparent" />
                    </div>
                </div>

            </div>
        </section>
    );
}
