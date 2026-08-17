import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Popover({
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
    return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
    return (
        <PopoverPrimitive.Trigger
            data-slot="popover-trigger"
            {...props}
        />
    );
}

function PopoverContent({
    className,
    align = 'start',
    sideOffset = 8,
    style,
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                data-slot="popover-content"
                align={align}
                sideOffset={sideOffset}
                side="bottom"
                className={cn(
                    'z-[100] w-72 rounded-md border bg-white p-0 text-popover-foreground shadow-lg outline-none',
                    'data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                    className,
                )}
                {...props}
                style={{
                    pointerEvents: 'auto',
                    ...style,
                }}
            >
                {props.children}
                <PopoverPrimitive.Arrow
                    data-slot="popover-arrow"
                    className="fill-white"
                />
            </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
    );
}

export { Popover, PopoverTrigger, PopoverContent };
