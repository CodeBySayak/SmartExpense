import { useState, useEffect, useRef } from "react";

export function useAnimatedCounter(targetValue, duration = 1000) {
  const [count, setCount] = useState(0);
  const startValRef = useRef(0);
  const targetValRef = useRef(targetValue);
  const startTimeRef = useRef(null);

  // Easing function: cubic ease-out
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  useEffect(() => {
    // If target value changed, trigger new animation starting from current count
    startValRef.current = count;
    targetValRef.current = targetValue;
    startTimeRef.current = null;

    let animFrameId;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const delta = targetValRef.current - startValRef.current;
      const currentVal = startValRef.current + delta * easedProgress;

      setCount(currentVal);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(animate);
      } else {
        setCount(targetValRef.current);
      }
    };

    animFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue, duration]);

  return count;
}
