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
                    '--normal-bg': '#ea580c',
                    '--normal-text': '#ffffff',
                    '--normal-border': '#c2410c',
                    '--success-bg': '#f97316',
                    '--success-text': '#ffffff',
                    '--success-border': '#ea580c',
                    '--error-bg': '#ef4444',
                    '--error-text': '#ffffff',
                    '--error-border': '#dc2626',
                    '--info-bg': '#f59e0b',
                    '--info-text': '#ffffff',
                    '--info-border': '#d97706',
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
