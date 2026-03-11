import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase'; // Ensure this points to your firebase setup

export function useDeviceDateTime() {
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // Listen to Firebase's internal connection time offset
  useEffect(() => {
    const offsetRef = ref(database, '.info/serverTimeOffset');
    const unsubscribe = onValue(offsetRef, (snap) => {
      const offset = snap.val() || 0;
      setServerOffsetMs(offset);
    });

    return () => unsubscribe();
  }, []);

  const getDateTime = () => {
    // True server time = Local Device Time + Firebase's Calculated Network Offset
    const trueServerTimestamp = Date.now() + serverOffsetMs;
    const now = new Date(trueServerTimestamp);

    // Use local year, month, and day based on the tampered-proof server time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // This creates "YYYY-MM-DD"
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
      timestamp: trueServerTimestamp, // The true, un-tamperable MS timestamp
      dateObj: now,
    };
  };

  return { getDateTime };
}