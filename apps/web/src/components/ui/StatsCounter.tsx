import { useEffect, useState, useRef } from 'react';

interface StatsCounterProps {
    value: number;
    duration?: number; // Duration of animation in ms
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
}

export function StatsCounter({
    value,
    duration = 1500,
    prefix = '',
    suffix = '',
    decimals = 0,
    className = ''
}: StatsCounterProps) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const animationFrameId = useRef<number>();
    const startTime = useRef<number | null>(null);

    useEffect(() => {
        // Reset state when value changes
        startTime.current = null;
        const startValue = countRef.current;
        const targetValue = value;
        const change = targetValue - startValue;

        if (change === 0) return;

        const animate = (timestamp: number) => {
            if (!startTime.current) startTime.current = timestamp;
            const progress = timestamp - startTime.current;

            // Calculate easing (easeOutQuart)
            const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
            const percentage = Math.min(progress / duration, 1);
            const easedProgress = easeOutQuart(percentage);

            const currentValue = startValue + change * easedProgress;
            setCount(currentValue);
            countRef.current = currentValue;

            if (progress < duration) {
                animationFrameId.current = requestAnimationFrame(animate);
            } else {
                setCount(targetValue);
                countRef.current = targetValue;
            }
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [value, duration]);

    // Format the number
    const formattedNumber = count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    return (
        <span className={`font-variant-numeric tabular-nums ${className}`}>
            {prefix}{formattedNumber}{suffix}
        </span>
    );
}
