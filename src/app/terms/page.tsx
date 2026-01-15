import React from 'react';
import { Footer } from '@/components/Layout/Footer';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <div className="flex-1 max-w-3xl mx-auto p-8 lg:py-12">
                <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
                <p className="mb-8 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8 glass-card p-8 rounded-2xl border border-border">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using MealPrepper, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">2. Use of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You represent that you are of legal age to form a binding contract. You are responsible for maintaining the confidentiality of your account and password.
                            You agree not to misuse our services or help anyone else do so.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">3. AI-Generated Content</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our service uses Artificial Intelligence to generate meal plans and recipes. While we strive for accuracy, AI-generated content may utilize incorrect or misleading information.
                            You should always verify important dietary and nutritional information independently, especially if you have severe allergies or medical conditions.
                            MealPrepper is not responsible for any adverse effects resulting from the use of our recipes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">4. Acceptable Use</h2>
                        <p className="mb-2 text-muted-foreground">
                            You agree not to engage in any of the following prohibited activities:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                            <li>Using the service for any illegal purpose.</li>
                            <li>Attempting to bypass our security measures or rate limits.</li>
                            <li>Harassing, abusing, or harming another person.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">5. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">6. Changes</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
}
