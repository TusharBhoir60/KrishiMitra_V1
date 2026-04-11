import { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

export const AnimatedCounter = ({ value, duration = 2000, decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true });
  const countRef = useRef(0);

  useEffect(() => {
    if (inView) {
      let startTime;
      let animationFrame;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        
        // easeOutCubic
        const ease = 1 - Math.pow(1 - Math.min(progress / duration, 1), 3);
        const currentCount = ease * value;
        
        countRef.current = currentCount;
        setCount(currentCount);

        if (progress < duration) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setCount(value);
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [inView, value, duration]);

  return <span ref={ref}>{count.toFixed(decimals)}</span>;
};
