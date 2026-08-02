import { usePage } from '@inertiajs/react';

export function useCan(): (permission: string) => boolean {
    const { permissions } = usePage<{ permissions: string[] }>().props;

    return (permission: string) => (permissions ?? []).includes(permission);
}
