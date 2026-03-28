import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

dayjs.tz.setDefault('Asia/Kolkata');

export const formatDate = (iso) => dayjs(iso).format('D MMM YYYY');
export const formatTime = (iso) => dayjs(iso).format('h:mm A');
export const formatDateTime = (iso) => dayjs(iso).format('D MMM YYYY, h:mm A');

export const timeAgo = (iso) => {
  if (!iso) return '';
  const d = dayjs(iso);
  const now = dayjs();
  const diffMin = now.diff(d, 'minute');
  const diffHour = now.diff(d, 'hour');
  
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour < 24) {
    if (now.date() === d.date()) return `${diffHour} hours ago`;
    return 'Yesterday';
  }
  return formatDate(iso);
};
