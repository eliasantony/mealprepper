"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Footer } from '@/components/Layout/Footer';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim() || !message.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    subject,
                    message,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            toast.success("Message sent successfully! We'll get back to you soon.");
            // Reset form
            setName('');
            setEmail('');
            setSubject('');
            setMessage('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background border-border">
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="bg-white dark:bg-card border border-border rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-orange-500/10 rounded-xl">
                            <Mail className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Contact Us</h1>
                            <p className="text-muted-foreground">Have a question? We'd love to hear from you.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-3 rounded-lg bg-secondary/50 border border-border focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="Your name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 rounded-lg bg-secondary/50 border border-border focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                            <input
                                id="subject"
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full p-3 rounded-lg bg-secondary/50 border border-border focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                placeholder="What is this regarding?"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="message" className="text-sm font-medium">Message</label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full min-h-[150px] p-3 rounded-lg bg-secondary/50 border border-border focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none transition-all"
                                placeholder="How can we help you?"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Send Message</span>
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}
