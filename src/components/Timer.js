import React, { useState, useEffect } from 'react';

function Timer({ onTimeUp }) {
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      onTimeUp?.();
    }
  }, [timer, onTimeUp]);

  return (
    <div className="timer">
      Süre: {timer}
    </div>
  );
}

export default Timer; 