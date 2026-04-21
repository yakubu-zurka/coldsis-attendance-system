import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useDeviceDateTime() {
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  useEffect(() => {
    // Fetch server time to calculate offset
    const fetchServerTime = async () => {
      try {
        const start = Date.now();
        const response = await fetch(`${API_URL}/api/time`);
        const data = await response.json();
        const end = Date.now();
        
        // Approximate latency
        const latency = (end - start) / 2;
        const serverTimestamp = data.timestamp;
        
        // Offset = Server Time - Client Time
        // When we want true server time later, we do Client Time + Offset
        const offset = serverTimestamp - (Date.now() - latency);
        setServerOffsetMs(offset);
      } catch (error) {
        console.error("Failed to fetch server time:", error);
      }
    };

    fetchServerTime();
    
    // Refresh offset every hour to handle clock drift
    const interval = setInterval(fetchServerTime, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getDateTime = () => {
    // True server time = Local Device Time + Calculated Network Offset
    const trueServerTimestamp = Date.now() + serverOffsetMs;
    const now = new Date(trueServerTimestamp);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const date = `${year}-${month}-${day}`; 

    const time = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    return {
      date,
      time,
      timeString,
      timestamp: trueServerTimestamp,
      dateObj: now,
    };
  };

  return { getDateTime };
}