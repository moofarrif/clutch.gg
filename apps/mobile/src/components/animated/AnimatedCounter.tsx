import { useEffect, useState, useRef } from 'react';
import { type TextStyle, Text } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: TextStyle;
}

export function AnimatedCounter({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  style,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(0);

  useEffect(() => {
    fromRef.current = displayValue;
    startRef.current = Date.now();
    const target = value;
    const startTime = Date.now();
    const startValue = fromRef.current;

    let rafId: number;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <Text style={style} selectable>
      {`${prefix}${displayValue}${suffix}`}
    </Text>
  );
}
