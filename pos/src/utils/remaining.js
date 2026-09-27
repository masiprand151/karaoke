export function getRemainingTime(start, end) {
  if (!start || !end) {
    return {
      remainingMs: 0,
      elapsedMs: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      remainingText: "00:00:00",
      isExpired: true,
    };
  }

  const now = Date.now();

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  const totalDuration = endTime - startTime;
  const remaining = Math.max(endTime - now, 0);
  const elapsed = Math.min(now - startTime, totalDuration);

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return {
    remainingMs: remaining,
    elapsedMs: elapsed,

    hours,
    minutes,
    seconds,

    remainingText: `${String(hours).padStart(2, "0")}:${String(
      minutes,
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    warning: remaining <= 900 && remaining > 0,
    isExpired: remaining <= 0,
  };
}

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours} jam ${mins} menit`;
  } else if (hours > 0) {
    return `${hours} jam`;
  } else if (mins !== 0) {
    return `${mins} menit`;
  } else {
    return mins;
  }
}
