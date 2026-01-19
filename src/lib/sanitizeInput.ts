/**
 * Utilities for sanitizing user inputs before they're used in AI prompts.
 * Prevents prompt injection attacks through user-provided fields.
 */

// Patterns that could be used for prompt injection
const INJECTION_PATTERNS = [
    // Common override attempts
    /ignore\s*(all\s*)?(previous|above|prior|preceding)/gi,
    /disregard\s*(all\s*)?(previous|above|prior|preceding)/gi,
    /forget\s*(all\s*)?(previous|above|prior|preceding)/gi,
    /override\s*(all\s*)?(previous|above|prior|preceding)/gi,
    /skip\s*(all\s*)?(previous|above|prior|preceding)/gi,

    // Role/context manipulation
    /system\s*:/gi,
    /assistant\s*:/gi,
    /user\s*:/gi,
    /\[system\]/gi,
    /\[assistant\]/gi,
    /\[user\]/gi,
    /\[inst\]/gi,
    /\[\/inst\]/gi,

    // Template/formatting markers
    /<<.*?>>/g,
    /\{\{.*?\}\}/g,
    /<\|.*?\|>/g,

    // Direct instruction attempts
    /you\s+must\s+(now\s+)?/gi,
    /you\s+are\s+now\s+/gi,
    /new\s+instructions?\s*:/gi,
    /updated?\s+instructions?\s*:/gi,
    /instead\s*,?\s*(you\s+should|do\s+this)/gi,

    // JSON/format breaking attempts
    /return\s+(only\s+)?a?\s*valid\s*json/gi,
    /output\s+format\s*:/gi,
];

// Maximum length for user preference fields
const MAX_PREFERENCE_LENGTH = 500;

/**
 * Sanitizes user-provided text to prevent prompt injection attacks.
 * 
 * @param input - The raw user input string
 * @returns Sanitized string safe for use in AI prompts
 */
export function sanitizeUserPreference(input: string | undefined): string {
    if (!input) return '';

    // Truncate to max length
    let sanitized = input.slice(0, MAX_PREFERENCE_LENGTH);

    // Remove potential injection patterns
    for (const pattern of INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Collapse multiple whitespace/newlines into single spaces
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
}

/**
 * Checks if input appears to contain injection attempts.
 * Useful for logging/monitoring purposes.
 * 
 * @param input - The raw user input string
 * @returns true if suspected injection patterns were found
 */
export function containsInjectionAttempt(input: string | undefined): boolean {
    if (!input) return false;

    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(input)) {
            return true;
        }
    }

    return false;
}
