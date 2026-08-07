import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { emailRule, minLengthRule, requiredRule, validateFields } from '@/lib/form-validation';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
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
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                password_confirmation: formData.get('password_confirmation'),
            },
            {
                name: [requiredRule('Name is required.')],
                email: [requiredRule('Email address is required.'), emailRule()],
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
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
                onSubmit={handleSubmit}
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                    onChange={() => handleFieldChange('name')}
                                    aria-invalid={Boolean(errors.name || clientErrors.name)}
                                    className={errors.name || clientErrors.name ? 'border-red-500' : ''}
                                />
                                <InputError
                                    message={errors.name || clientErrors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                    onChange={() => handleFieldChange('email')}
                                    aria-invalid={Boolean(errors.email || clientErrors.email)}
                                    className={errors.email || clientErrors.email ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.email || clientErrors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                    onChange={() => handleFieldChange('password')}
                                    aria-invalid={Boolean(errors.password || clientErrors.password)}
                                    className={errors.password || clientErrors.password ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.password || clientErrors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                    onChange={() => handleFieldChange('password_confirmation')}
                                    aria-invalid={Boolean(errors.password_confirmation || clientErrors.password_confirmation)}
                                    className={errors.password_confirmation || clientErrors.password_confirmation ? 'border-red-500' : ''}
                                />
                                <InputError
                                    message={errors.password_confirmation || clientErrors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
