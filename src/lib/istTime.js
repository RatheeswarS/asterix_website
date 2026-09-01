/**
 * Indian Standard Time helpers.
 *
 * Recruitment deadlines are stored as ISO strings carrying an explicit +05:30
 * offset so every visitor reads the same instant regardless of their own
 * timezone. `datetime-local` inputs, though, speak the editor's local time, so
 * both directions have to be converted through IST rather than through the
 * browser's zone.
 *
 * Extracted from the admin dashboard so the dashboard and the public portal
 * cannot drift into two different interpretations of the same timestamp.
 */

export const IST = 'Asia/Kolkata';
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** ISO string -> the `YYYY-MM-DDTHH:mm` a datetime-local input expects, in IST. */
export const istInputValue = (iso) => {
    if (!iso) return '';
    const ms = new Date(iso).getTime();
    if (Number.isNaN(ms)) return '';
    return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 16);
};

/** datetime-local value -> an ISO string pinned to IST. */
export const istInputToIso = (value) => (value ? `${value}:00+05:30` : '');

const longFormatter = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: IST
});

const shortFormatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    timeZone: IST
});

const dayFormatter = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: IST
});

export const formatIstFull = (value) => {
    const ms = new Date(value).getTime();
    if (Number.isNaN(ms)) return '';
    return `${longFormatter.format(new Date(ms)).replace(/,/g, '')} IST`;
};

export const formatIstShort = (value) => {
    const ms = new Date(value).getTime();
    if (Number.isNaN(ms)) return '';
    return shortFormatter.format(new Date(ms));
};

export const formatIstDay = (value) => {
    const ms = new Date(value).getTime();
    if (Number.isNaN(ms)) return '';
    return dayFormatter.format(new Date(ms));
};
