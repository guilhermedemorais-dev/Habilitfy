import type { Availability } from "@shared/schema";

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const buildAvailableTimes = (
  availability: Availability[],
  date: Date,
  slotDurationMinutes: number,
) => {
  const duration = slotDurationMinutes > 0 ? slotDurationMinutes : 50;
  const dayOfWeek = date.getDay();
  const slots = availability.filter((slot) => slot.dayOfWeek === dayOfWeek);
  const times: number[] = [];

  slots.forEach((slot) => {
    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);
    for (let minutes = start; minutes + duration <= end; minutes += duration) {
      times.push(minutes);
    }
  });

  return Array.from(new Set(times))
    .sort((a, b) => a - b)
    .map((minutes) => toTime(minutes));
};
