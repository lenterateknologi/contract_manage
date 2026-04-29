import { usePage } from '@inertiajs/react';
import Lottie from 'lottie-react';
import React, { useEffect, useState } from 'react';

interface Props {
    width?: number | string;
    height?: number | string;
    className?: string;
}

/**
 * LoadingLottie - Premium Lottie loading component
 * Uses the local loading.json for consistent branding and offline reliability
 */
export default function LoadingLottie({ width = 120, height = 120, className }: Props) {
    const [animationData, setAnimationData] = useState<any>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Fetch the local loading animation
        fetch('/assets/lottie/loading.json')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load lottie');
                return res.json();
            })
            .then((data) => setAnimationData(data))
            .catch((err) => {
                console.error('Failed to load Lottie:', err);
                setError(true);
            });
    }, []);

    if (error) {
        return (
            <div 
                className="flex items-center justify-center animate-pulse bg-slate-100 rounded-full" 
                style={{ width, height }}
            >
                <div className="w-1/2 h-1/2 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
            </div>
        );
    }

    if (!animationData) {
        return <div className="bg-black/5 dark:bg-white/5 animate-pulse rounded-full" style={{ width, height }} />;
    }

    return (
        <div className={className} style={{ width, height }}>
            <Lottie animationData={animationData} loop={true} />
        </div>
    );
}
