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
                    '--normal-bg': '#dc2626',
                    '--normal-text': '#ffffff',
                    '--normal-border': '#b91c1c',
                    '--success-bg': '#f87171',
                    '--success-text': '#ffffff',
                    '--success-border': '#ef4444',
                    '--error-bg': '#ef4444',
                    '--error-text': '#ffffff',
                    '--error-border': '#dc2626',
                    '--info-bg': '#f87171',
                    '--info-text': '#ffffff',
                    '--info-border': '#ef4444',
                    '--warning-bg': '#dc2626',
                    '--warning-text': '#ffffff',
                    '--warning-border': '#b91c1c',
                    '--toast-close-bg': 'rgba(255,255,255,0.15)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
