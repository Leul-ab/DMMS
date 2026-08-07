import { useCallback, useState } from 'react';
import { validateField  } from '@/lib/form-validation';
import type {ValidationRule} from '@/lib/form-validation';

/**
 * A hook that combines server-side (Inertia) errors with client-side
 * validation rules, and provides real-time clearing of errors as the
 * user types.
 *
 * Returns:
 * - `errors`: Combined record of field → error message.
 * - `errorFor(field)`: Helper to get the error message for a field.
 * - `validate`: Run all rules against the current form values.
 * - `handleFieldChange(field, setter, value)`: Updates the form value and
 *   clears the client error for that field immediately.
 * - `clearServerErrors`: Merge new server errors into the state.
 */
export function useInlineValidation<Data extends Record<string, unknown>>(
    serverErrors: Record<string, string>,
    schema: Record<string, ValidationRule[]> = {},
) {
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const errorFor = useCallback(
        (field: string): string | undefined => {
            return clientErrors[field] ?? serverErrors[field];
        },
        [clientErrors, serverErrors],
    );

    /** Validate a single field against its rules (used for real-time re-validation). */
    const validateFieldValue = useCallback(
        (field: string, value: unknown, allValues: Data): string | null => {
            const rules = schema[field];

            if (!rules) {
                return null;
            }

            return validateField(value, rules, allValues);
        },
        [schema],
    );

    /**
     * A change handler that updates the form data and immediately clears
     * the client-side error if the field becomes valid.
     */
    const handleFieldChange = useCallback(
        (
            field: keyof Data,
            setter: (value: never) => void,
            value: unknown,
            nextValues?: Data,
        ) => {
            const allValues = (nextValues ?? { ...(serverErrors as Data), [field]: value }) as Data;

            setter(value as never);

            // Re-validate this field in real-time. If it's now valid, drop the error.
            const message = validateFieldValue(field as string, value, allValues);

            setClientErrors((prev) => {
                if (message) {
                    return { ...prev, [field as string]: message };
                }

                const next = { ...prev };
                delete next[field as string];

                return next;
            });
        },
        [validateFieldValue, serverErrors],
    );

    /** Run all validation rules and return true if the form is valid. */
    const validate = useCallback(
        (values: Data): boolean => {
            const nextErrors: Record<string, string> = {};

            Object.keys(schema).forEach((field) => {
                const message = validateFieldValue(field, values[field], values);

                if (message) {
                    nextErrors[field] = message;
                }
            });

            setClientErrors(nextErrors);

            return Object.keys(nextErrors).length === 0;
        },
        [schema, validateFieldValue],
    );

    /** Clear all client errors. */
    const clearErrors = useCallback(() => {
        setClientErrors({});
    }, []);

    return {
        errors: { ...clientErrors, ...serverErrors },
        clientErrors,
        errorFor,
        validate,
        handleFieldChange,
        clearErrors,
    };
}
