import { useState, useEffect } from 'react';

export const CountdownTimer = ({ deadline, onExpire, warnBeforeMinutes = 60 }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isWarning, setIsWarning] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadline) return;

    const calculateTimeLeft = () => {
      const diff = new Date(deadline).getTime() - new Date().getTime();
      
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
        if (onExpire) onExpire();
        return;
      }

      const totalMinutes = Math.floor(diff / 1000 / 60);
      setIsWarning(totalMinutes <= warnBeforeMinutes);

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      setTimeLeft(`${hours} hrs ${mins} mins left`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [deadline, onExpire, warnBeforeMinutes]);

  if (expired) {
    return <span className="text-red-500 font-body font-semibold">{timeLeft}</span>;
  }

  return (
    <span className={`font-body font-medium ${isWarning ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
      {timeLeft}
    </span>
  );
};
