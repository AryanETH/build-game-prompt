import { useEffect, useState } from 'react';

export const useCountUp = (end: number, duration: number = 1200, isVisible: boolean = true) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible || end === 0) return;

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.floor(startValue + (end - startValue) * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, isVisible]);

  return count;
};
