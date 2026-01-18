'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { MessageSquare, Calendar, ArrowLeft, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export default function GetStartedPage() {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const whatsappNumber = "918975706582";

    // Generate WhatsApp deep link
    const getWaLink = (message: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getWaLink("Hi! I am interested in Kuberbook. I would like to know more."))}`;

    const handleBooking = () => {
        if (!selectedDate || !selectedTime) {
            alert("Please select a date and time first.");
            return;
        }
        const message = `Hi! I would like to book a demo for Kuberbook.\n\nPreferred Date: ${selectedDate}\nPreferred Time: ${selectedTime}`;
        window.open(getWaLink(message), '_blank');
    };

    return (
        <main className="min-h-screen bg-ledger-paper selection:bg-brand-100 pb-12">
            {/* Header / Nav */}
            <nav className="p-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-ledger-charcoal/60 hover:text-ledger-charcoal transition-colors group text-sm font-bold uppercase tracking-widest"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Kuberbook
                </Link>
            </nav>

            <div className="container px-6 mx-auto py-4">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-ledger-charcoal mb-4">Let's Grow Your Business</h1>
                        <p className="text-lg text-ledger-charcoal/60 max-w-2xl mx-auto">Choose your preferred way to start with Kuberbook.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                        {/* Option 1: WhatsApp with QR */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-[2rem] p-8 shadow-ledger border border-ledger-border hover:shadow-ledger-xl transition-all group relative overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#25D366]/5 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-ledger-charcoal">Chat on WhatsApp</h2>
                                    <p className="text-sm text-ledger-charcoal/50">Direct founder line</p>
                                </div>
                            </div>

                            <p className="text-ledger-charcoal/60 mb-6 text-sm leading-relaxed">
                                Connect directly with our founder. Scan the QR code or click below to start a conversation instantly.
                            </p>

                            <div className="flex flex-col items-center gap-4 py-8 mb-8 bg-ledger-paper/30 rounded-3xl border border-ledger-border/50 transition-colors group-hover:bg-ledger-paper/50">
                                <div className="bg-white p-3 rounded-2xl shadow-md shrink-0 ring-8 ring-white/50">
                                    <img
                                        src={qrCodeUrl}
                                        alt="WhatsApp QR Code"
                                        className="w-32 h-32"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-ledger-charcoal/40 uppercase tracking-widest mb-1.5">Founder Line</p>
                                    <p className="text-2xl font-bold text-ledger-charcoal tracking-tight">+91 89757 06582</p>
                                    <p className="text-[11px] text-ledger-charcoal/50 mt-1 uppercase tracking-wider font-semibold">Ready to chat</p>
                                </div>
                            </div>

                            <a
                                href={getWaLink("Hi! I am interested in Kuberbook. I would like to know more about how it can help my business.")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full mt-auto py-4 bg-[#25D366] text-white rounded-full font-bold shadow-lg hover:shadow-[#25D366]/20 transition-all flex items-center justify-center gap-3 group/btn"
                            >
                                Send Message <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                            </a>
                        </motion.div>

                        {/* Option 2: Live Demo with Interactive Booking */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[2rem] p-8 shadow-ledger border border-ledger-border hover:shadow-ledger-xl transition-all group relative overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-500 flex items-center justify-center shrink-0">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-ledger-charcoal">Book a Video Demo</h2>
                                    <p className="text-sm text-ledger-charcoal/50">15-min personalized tour</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-[10px] font-bold text-ledger-charcoal/40 uppercase tracking-widest mb-2 block">1. Select a Day</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedDate(day)}
                                                className={`py-2 rounded-lg border text-[10px] sm:text-[11px] font-bold transition-all ${selectedDate === day
                                                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                                                    : 'border-ledger-border bg-white text-ledger-charcoal/50 hover:border-ledger-charcoal'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-ledger-charcoal/40 uppercase tracking-widest mb-2 block">2. Select a Time</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 overflow-y-auto max-h-[120px] pr-1 scrollbar-thin">
                                        {[
                                            '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
                                            '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
                                            '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'
                                        ].map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`py-2 rounded-lg border text-[9px] sm:text-[10px] font-bold transition-all ${selectedTime === time
                                                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                                                    : 'border-ledger-border bg-white text-ledger-charcoal/50 hover:border-ledger-charcoal'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic QR Reveal */}
                            <div className="min-h-[160px] mt-2 mb-4">
                                {selectedDate && selectedTime ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-brand-500/5 p-4 rounded-3xl border border-brand-500/20 flex flex-col sm:flex-row items-center gap-6"
                                    >
                                        <div className="bg-white p-2 rounded-2xl shadow-md shrink-0 ring-4 ring-white/50">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getWaLink(`Hi! I would like to book a demo for Kuberbook.\n\nPreferred Date: ${selectedDate}\nPreferred Time: ${selectedTime}`))}`}
                                                alt="Booking QR Code"
                                                className="w-28 h-28"
                                            />
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1.5 flex items-center justify-center sm:justify-start gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                                                Scan to confirm
                                            </p>
                                            <p className="text-[13px] font-bold text-ledger-charcoal leading-snug mb-2">
                                                Confirm for {selectedDate} at {selectedTime}
                                            </p>
                                            <p className="text-[10px] text-ledger-charcoal/40 font-medium leading-relaxed max-w-[180px]">
                                                Scanning from desktop? Use your phone camera to send this booking instantly.
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-ledger-border/40 rounded-[2rem] opacity-40">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-center">Select slot to <br />reveal booking QR</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleBooking}
                                className="w-full mt-auto py-4 bg-ledger-charcoal text-white rounded-full font-bold shadow-lg hover:bg-brand-900 transition-all flex items-center justify-center gap-3 group/btn"
                            >
                                Schedule Meeting <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    </div>

                    {/* Trust Banner */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-12 mb-16 flex flex-wrap items-center justify-center gap-6 text-ledger-charcoal/30"
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">1-Month Free Trial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">No Card Needed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Direct Line Support</span>
                        </div>
                    </motion.div>

                    {/* Simple Footer */}
                    <div className="pt-8 border-t border-ledger-border/40 text-center">
                        <p className="text-xs text-ledger-charcoal/40 font-medium mb-1">
                            A product of <span className="text-ledger-charcoal/60 font-bold">Rajaram and Pallavi</span>
                        </p>
                        <p className="text-[10px] text-ledger-charcoal/20 uppercase tracking-widest">
                            © {new Date().getFullYear()} Kuberbook. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
