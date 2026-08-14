import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo({ className }: { className?: string }) {
    return (
        <>
            <div className={`flex items-center justify-center transition-all ${className || 'size-20 group-data-[collapsible=icon]:size-8'}`}>
                <img src="/mamaskitchen-logo.png" alt="Mana's Kitchen Logo" className="h-full w-auto object-contain" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                
                <p className="text-[10px] font-semibold tracking-[0.2em]  uppercase">
                            Digital Menu
                        </p>
            </div>
        </>
    );
}
