import { date } from 'quasar';

function FormatRelativeDate(selectedDate: Date): string {
  // one may want to pass the reference date as a parameter later on
  const minutesDiff = date.getDateDiff(new Date(), selectedDate, 'minutes');
  if (minutesDiff < 1) return 'now';
  if (minutesDiff < 60) return `${minutesDiff} minutes ago`;
  if (minutesDiff < 1440) return `${Math.round(minutesDiff / 60)} hours ago`;
  return `${Math.round(minutesDiff / 1440)} days ago`;
}

export default { FormatRelativeDate };
