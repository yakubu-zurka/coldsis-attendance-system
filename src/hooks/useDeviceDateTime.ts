export function useDeviceDateTime() {
  const getDateTime = () => {
    const now = new Date();

    // Use local year, month, and day to ensure it matches your physical location
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // This creates "YYYY-MM-DD" based on your local time
    const date = `${year}-${month}-${day}`; 

    const time = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    const timestamp = now.getTime();

    return {
      date,
      time,
      timeString,
      timestamp,
      dateObj: now,
    };
  };

  return { getDateTime };
}