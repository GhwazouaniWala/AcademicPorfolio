import { useEffect, useState } from "react";

export function useLiveClock(timeZone = "Africa/Tunis") {
  const [time, setTime] = useState(() => format(timeZone));

  useEffect(() => {
    const id = setInterval(() => setTime(format(timeZone)), 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  return time;
}

function format(timeZone) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString();
  }
}
