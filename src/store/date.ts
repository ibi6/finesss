export function formatLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0')
}

export function createDateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function getLocalDateKeyFromIso(iso: string) {
  return formatLocalDateKey(new Date(iso))
}

export function resolveDateKey(dateKey: string | undefined, iso: string) {
  return dateKey ?? getLocalDateKeyFromIso(iso)
}

export function createDateStamp(date = new Date()) {
  return {
    iso: date.toISOString(),
    dateKey: formatLocalDateKey(date),
  }
}

export function createDateStampForDateKey(dateKey: string, base = new Date()) {
  const date = createDateFromKey(dateKey)
  date.setHours(
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
    base.getMilliseconds(),
  )

  return {
    iso: date.toISOString(),
    dateKey,
  }
}

export function shiftDateKey(dateKey: string, offsetDays: number) {
  const date = createDateFromKey(dateKey)
  date.setDate(date.getDate() + offsetDays)

  return formatLocalDateKey(date)
}

export function isTodayDateKey(dateKey: string) {
  return dateKey === formatLocalDateKey(new Date())
}

export function formatDateKeyLabel(dateKey: string) {
  const date = createDateFromKey(dateKey)
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]

  return `${date.getFullYear()}年${padDatePart(date.getMonth() + 1)}月${padDatePart(date.getDate())}日 ${weekDay}`
}

export function formatShortDateKey(dateKey: string) {
  const date = createDateFromKey(dateKey)
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]

  return `${padDatePart(date.getMonth() + 1)}.${padDatePart(date.getDate())} ${weekDay}`
}
