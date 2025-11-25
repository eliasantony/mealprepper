"use client";

import React from 'react';
import { OnboardingWizard } from '@/components/Onboarding/OnboardingWizard';

export default function OnboardingPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-4xl">
                <OnboardingWizard />
            </div>
        </div>
    );
}
