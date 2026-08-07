import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { minLengthRule, requiredRule, validateFields } from '@/lib/form-validation';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
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
            {
                password: formData.get('password'),
                password_confirmation: formData.get('password_confirmation'),
            },
            {
                password: [requiredRule('Password is required.'), minLengthRule(8, 'Password must be at least 8 characters.')],
                password_confirmation: [
                    requiredRule('Please confirm your password.'),
                    (value, allValues) =>
                        value !== allValues?.password ? 'Passwords do not match.' : null,
                ],
            },
        );
        setClientErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            e.preventDefault();
        }
    };

    return (
        <>
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                onSubmit={handleSubmit}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="mt-1 block w-full"
                                readOnly
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder="Password"
                                passwordrules={passwordRules}
                                onChange={() => handleFieldChange('password')}
                                aria-invalid={Boolean(errors.password || clientErrors.password)}
                            />
                            <InputError message={errors.password || clientErrors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder="Confirm password"
                                passwordrules={passwordRules}
                                onChange={() => handleFieldChange('password_confirmation')}
                                aria-invalid={Boolean(errors.password_confirmation || clientErrors.password_confirmation)}
                            />
                            <InputError
                                message={errors.password_confirmation || clientErrors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            Reset password
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Please enter your new password below',
};
