import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-center"
            richColors
            style={
                {
                    '--normal-bg': '#de1d1d',
                    '--normal-text': '#ffffff',
                    '--normal-border': '#b91c1c',
                    '--success-bg': '#16a34a',
                    '--success-text': '#ffffff',
                    '--success-border': '#15803d',
                    '--error-bg': '#dc2626',
                    '--error-text': '#ffffff',
                    '--error-border': '#b91c1c',
                    '--info-bg': '#2563eb',
                    '--info-text': '#ffffff',
                    '--info-border': '#1d4ed8',
                    '--warning-bg': '#d97706',
                    '--warning-text': '#ffffff',
                    '--warning-border': '#b45309',
                    '--toast-close-bg': 'rgba(255,255,255,0.15)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
