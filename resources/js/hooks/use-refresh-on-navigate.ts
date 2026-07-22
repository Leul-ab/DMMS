import { router } from '@inertiajs/react';
import { useEffect } from 'react';

export function useRefreshOnNavigate() {
    useEffect(() => {
        const cleanup = router.on('navigate', () => {
            router.reload({ only: [] });
        });

        return () => cleanup();
    }, []);
}