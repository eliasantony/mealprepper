import React from 'react';
import { Footer } from '@/components/Layout/Footer';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <div className="flex-1 max-w-3xl mx-auto p-8 lg:py-12">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <p className="mb-8 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8 glass-card p-8 rounded-2xl border border-border">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Welcome to MealPrepper ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                            This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website and use our application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
                        <p className="mb-2 text-muted-foreground">We collect information that you strictly provide to us:</p>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                            <li><strong className="text-foreground">Personal Information:</strong> Name, email address, and profile picture (via Google Authentication).</li>
                            <li><strong className="text-foreground">Usage Data:</strong> Meal preferences, dietary restrictions, saved recipes, and meal plans.</li>
                            <li><strong className="text-foreground">Technical Data:</strong> IP address, browser type, and device information for security and debugging purposes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
                        <p className="mb-2 text-muted-foreground">We use the information we collect to:</p>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                            <li>Provide, operate, and maintain our application.</li>
                            <li>Generate personalized meal suggestions using AI services.</li>
                            <li>Improve, personalize, and expand our website.</li>
                            <li>Detect and prevent fraud (including rate limiting based on IP or User ID).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">4. Third-Party Services</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use third-party services for authentication (Firebase) and AI generation (Google Gemini).
                            Your data may be processed by these providers in accordance with their own privacy policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">5. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
}
