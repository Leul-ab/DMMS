import { Form, Head } from '@inertiajs/react';
import { useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { minLengthRule, requiredRule, validateFields } from '@/lib/form-validation';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
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
                current_password: formData.get('current_password'),
                password: formData.get('password'),
                password_confirmation: formData.get('password_confirmation'),
            },
            {
                current_password: [requiredRule('Current password is required.')],
                password: [requiredRule('New password is required.'), minLengthRule(8, 'Password must be at least 8 characters.')],
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
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
                />

                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="current_password">
                                    Current password
                                </Label>

                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    className="mt-1 block w-full"
                                    autoComplete="current-password"
                                    placeholder="Current password"
                                    onChange={() => handleFieldChange('current_password')}
                                    aria-invalid={Boolean(errors.current_password || clientErrors.current_password)}
                                />

                                <InputError message={errors.current_password || clientErrors.current_password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">New password</Label>

                                <PasswordInput
                                    id="password"
                                    ref={passwordInput}
                                    name="password"
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    placeholder="New password"
                                    passwordrules={props.passwordRules}
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
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                    passwordrules={props.passwordRules}
                                    onChange={() => handleFieldChange('password_confirmation')}
                                    aria-invalid={Boolean(errors.password_confirmation || clientErrors.password_confirmation)}
                                />

                                <InputError
                                    message={errors.password_confirmation || clientErrors.password_confirmation}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-password-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <ManageTwoFactor
                canManageTwoFactor={props.canManageTwoFactor}
                requiresConfirmation={props.requiresConfirmation}
                twoFactorEnabled={props.twoFactorEnabled}
            />

            <ManagePasskeys
                canManagePasskeys={props.canManagePasskeys}
                passkeys={props.passkeys}
            />
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
