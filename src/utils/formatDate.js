// Formats a date the way jsonplaceholder.org does: "dd/mm/yyyy HH:MM:SS".
export function formatDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
