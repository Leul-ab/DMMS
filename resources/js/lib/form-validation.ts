export type ValidationRule = (value: unknown, formValues?: Record<string, unknown>) => string | null;

export function requiredRule(message = 'This field is required.'): ValidationRule {
    return (value) => {
        if (value === null || value === undefined) {
            return message;
        }

        if (typeof value === 'string' && value.trim() === '') {
            return message;
        }

        return null;
    };
}

export function emailRule(message = 'Please enter a valid email address.'): ValidationRule {
    return (value) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const email = String(value).trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return message;
        }

        return null;
    };
}

export function phoneRule(message = 'Please enter a valid phone number.'): ValidationRule {
    return (value) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const phone = String(value).trim();

        if (!/^\+?[0-9\s()-]{7,15}$/.test(phone)) {
            return message;
        }

        return null;
    };
}

export function numericRule(message = 'This field must be a valid number.'): ValidationRule {
    return (value) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (Number.isNaN(Number(value))) {
            return message;
        }

        return null;
    };
}

export function positiveNumberRule(message = 'This value must be 0 or greater.'): ValidationRule {
    return (value) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const numberValue = Number(value);

        if (Number.isNaN(numberValue) || numberValue < 0) {
            return message;
        }

        return null;
    };
}

export function minLengthRule(min: number, message: string): ValidationRule {
    return (value) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (String(value).trim().length < min) {
            return message;
        }

        return null;
    };
}

export function confirmFieldRule(fieldName: string, message = 'Passwords do not match.'): ValidationRule {
    return (value, formValues) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (String(value) !== String(formValues?.[fieldName] ?? '')) {
            return message;
        }

        return null;
    };
}

export function fileTypeRule(allowedTypes: string[], message = 'Unsupported file type.'): ValidationRule {
    return (value) => {
        if (!value || typeof value === 'string') {
            return null;
        }

        const file = value as File;

        if (!allowedTypes.includes(file.type)) {
            return message;
        }

        return null;
    };
}

export function fileSizeRule(maxBytes: number, message = 'File is too large.'): ValidationRule {
    return (value) => {
        if (!value || typeof value === 'string') {
            return null;
        }

        const file = value as File;

        if (file.size > maxBytes) {
            return message;
        }

        return null;
    };
}

export function validateField(value: unknown, rules: ValidationRule[] = [], formValues?: Record<string, unknown>): string | null {
    for (const rule of rules) {
        const message = rule(value, formValues);
        if (message) {
            return message;
        }
    }

    return null;
}

export function validateFields(values: Record<string, unknown>, schema: Record<string, ValidationRule[]>): Record<string, string> {
    const errors: Record<string, string> = {};

    Object.entries(schema).forEach(([field, rules]) => {
        const message = validateField(values[field], rules, values);
        if (message) {
            errors[field] = message;
        }
    });

    return errors;
}
