import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

export function FeedbackModal({ isOpen, onClose, userId }: FeedbackModalProps) {
    const [rating, setRating] = useState<number>(0);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [category, setCategory] = useState<'bug' | 'feature' | 'general'>('general');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!rating && !message.trim()) {
            toast.error("Please provide a rating or message");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    rating,
                    message,
                    category,
                    timestamp: new Date().toISOString()
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            toast.success("Thank you for your feedback!");
            onClose();
            // Reset form
            setRating(0);
            setMessage('');
            setCategory('general');
        } catch (error) {
            console.error(error);
            toast.error("Failed to send feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-background rounded-2xl shadow-xl border border-border overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <div className="p-2 bg-orange-500/10 rounded-lg">
                                            <MessageSquare className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <h2 className="text-xl font-bold">Feedback</h2>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Rating */}
                                    <div className="flex flex-col items-center gap-2">
                                        <label className="text-sm font-medium text-muted-foreground">How would you rate your experience?</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className={`p-1 transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-muted-foreground/30'
                                                        }`}
                                                >
                                                    <Star className="w-8 h-8 fill-current" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Category</label>
                                        <div className="flex gap-2 pt-2">
                                            {(['general', 'feature', 'bug'] as const).map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setCategory(cat)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === cat
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                                        }`}
                                                >
                                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Message</label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Tell us what you think..."
                                            className="w-full min-h-[120px] p-3 rounded-xl bg-secondary/50 border border-border focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none placeholder:text-muted-foreground/50"
                                            required={!rating} // Require message if no rating
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || (!rating && !message.trim())}
                                        className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Send Feedback</span>
                                                <Send className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
