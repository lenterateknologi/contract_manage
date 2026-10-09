import * as React from 'react';

export interface FloatingPosition {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: 'bottom' | 'top';
}

export interface UseFloatingDropdownOptions {
    minWidth?: number;
    maxWidth?: number;
    align?: 'start' | 'center' | 'end';
    preferredMaxHeight?: number;
}

export function useFloatingDropdown(
    triggerRef: React.RefObject<HTMLElement | null>,
    isOpen: boolean,
    options?: UseFloatingDropdownOptions
): FloatingPosition | null {
    const [coords, setCoords] = React.useState<FloatingPosition | null>(null);

    const updatePosition = React.useCallback(() => {
        if (!triggerRef.current || !isOpen) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const gap = 4;
        const preferredMaxHeight = options?.preferredMaxHeight || 480;

        const spaceBelow = viewportHeight - rect.bottom - gap - 12;
        const spaceAbove = rect.top - gap - 12;

        let placement: 'bottom' | 'top' = 'bottom';
        let top = rect.bottom + gap;
        let maxHeight = Math.min(preferredMaxHeight, spaceBelow);

        // If below space is less than 220px and above has more space, flip to top
        if (spaceBelow < 220 && spaceAbove > spaceBelow) {
            placement = 'top';
            maxHeight = Math.min(preferredMaxHeight, spaceAbove);
            top = rect.top - gap;
        }

        let width = rect.width;
        if (options?.minWidth && width < options.minWidth) {
            width = Math.min(options.minWidth, viewportWidth - 16);
        }
        if (options?.maxWidth && width > options.maxWidth) {
            width = options.maxWidth;
        }

        let left = rect.left;
        if (options?.align === 'end') {
            left = rect.right - width;
        } else if (options?.align === 'center') {
            left = rect.left + (rect.width - width) / 2;
        }

        // Clamp to viewport horizontally
        if (left + width > viewportWidth - 8) {
            left = viewportWidth - width - 8;
        }
        if (left < 8) {
            left = 8;
        }

        setCoords(prev => {
            if (
                prev &&
                prev.top === top &&
                prev.left === left &&
                prev.width === width &&
                prev.maxHeight === maxHeight &&
                prev.placement === placement
            ) {
                return prev;
            }
            return {
                top,
                left,
                width,
                maxHeight: Math.max(140, maxHeight),
                placement,
            };
        });
    }, [isOpen, triggerRef, options?.align, options?.maxWidth, options?.minWidth, options?.preferredMaxHeight]);

    const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

    useIsomorphicLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
            const handleScroll = (e: Event) => {
                const target = e.target as HTMLElement | null;
                if (target?.closest?.('[data-portal-dropdown]')) {
                    return;
                }
                updatePosition();
            };

            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', updatePosition);
            };
        } else {
            setCoords(null);
        }
    }, [isOpen, updatePosition]);

    return coords;
}
