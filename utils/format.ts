export function formatTaipeiTime(sqliteDatetime?: string | null) {
  // sqliteDatetime like "2026-01-13 23:11:00"
  if (!sqliteDatetime) return "-";
  // 只做簡單顯示：MM/DD HH:mm
  const [datePart, timePart] = sqliteDatetime.split(" ");
  if (!datePart || !timePart) return sqliteDatetime;
  const [, m, d] = datePart.split("-");
  const [hh, mm] = timePart.split(":");
  return `${m}/${d} ${hh}:${mm}`;
}

export function parseSqliteDatetime(sqliteDatetime?: string | null) {
  if (!sqliteDatetime) return null;
  const [datePart, timePart] = sqliteDatetime.split(" ");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  const date = new Date(
    year,
    (month ?? 1) - 1,
    day ?? 1,
    hour ?? 0,
    minute ?? 0,
    second ?? 0
  );
  return Number.isNaN(date.getTime()) ? null : date;
}
