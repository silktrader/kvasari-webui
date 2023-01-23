import { date } from 'quasar';

const formatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short' });

function FormatRelativeDate(dateString: string): string {
  // one may want to pass the reference date as a parameter later on
  const minutesDiff = date.getDateDiff(new Date(), new Date(Date.parse(dateString)), 'minutes');
  if (minutesDiff < 1) return 'seconds ago';
  if (minutesDiff === 60) return '1 minute ago'
  if (minutesDiff < 60) return `${minutesDiff} minutes ago`;
  if (minutesDiff < 1440) return `${Math.round(minutesDiff / 60)} hours ago`;
  return `${Math.round(minutesDiff / 1440)} days ago`;
}

const FormatLongDate = (date: string) => formatter.format(new Date(Date.parse(date)));

export default { FormatRelativeDate, FormatLongDate };
