import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    index as confirmOptions,
    store as confirmStore,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { requiredRule, validateFields } from '@/lib/form-validation';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const handleFieldChange = (field: string) => {
        if (clientErrors[field]) {
            setClientErrors((prev) => {
                const next = { ...prev };
                delete next[field];

                return next;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget);
        const nextErrors = validateFields(
            { password: formData.get('password') },
            {
                password: [requiredRule('Password is required.')],
            },
        );
        setClientErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            e.preventDefault();
        }
    };

    return (
        <>
            <Head title="Confirm password" />

            <PasskeyVerify
                routes={{
                    options: confirmOptions(),
                    submit: confirmStore(),
                }}
                label="Confirm with passkey"
                loadingLabel="Confirming..."
                separator="Or confirm with password"
            />

            <Form {...store.form()} resetOnSuccess={['password']} onSubmit={handleSubmit}>
                {({ processing, errors }) => (
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="Password"
                                autoComplete="current-password"
                                autoFocus
                                onChange={() => handleFieldChange('password')}
                                aria-invalid={Boolean(errors.password || clientErrors.password)}
                                className={errors.password || clientErrors.password ? 'border-red-500' : ''}
                            />

                            <InputError message={errors.password || clientErrors.password} />
                        </div>

                        <div className="flex items-center">
                            <Button
                                className="w-full"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner />}
                                Confirm password
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirm password',
    description:
        'This is a secure area of the application. Please confirm your password before continuing.',
};
