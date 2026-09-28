import type { RubRates } from '../../api/frankfurter'
import type { Envelope, SavingsOperation } from '../../api/types'

export type EnvelopeLocationState = {
  envelopeId?: string
  fromView?: boolean
}

export type SavingsQuickRange = 'quarter' | 'year'

export type SavingsPeriodMetrics = {
  change: number
  deposited: number
  withdrawn: number
  chartLabels: string[]
  chartValues: number[]
}

export const formatMoney = (value: number) =>
  value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })

export const formatSignedMoney = (value: number) => {
  const abs = formatMoney(Math.abs(value))

  if (value > 0) return `+${abs}`
  if (value < 0) return `−${abs}`

  return abs
}

export const toRub = (
  operation: SavingsOperation,
  rates: RubRates | null,
): number => {
  if (operation.currency === 'RUB') {
    return operation.amount
  }

  const rubPerUnit = rates?.rubPerUnit[operation.currency]

  if (rubPerUnit === undefined) {
    return 0
  }

  return operation.amount * rubPerUnit
}

export const readSelectedSavingsUser = (): Envelope['user'] | null => {
  const value = localStorage.getItem('half_selected_user')

  return value === 'max' || value === 'sasha' ? value : null
}

export const operationTypeLabel = (
  type: SavingsOperation['operation_type'],
): string => {
  switch (type) {
    case 'DEPOSIT':
      return 'Внесение'
    case 'WITHDRAWAL':
      return 'Снятие'
    case 'TRANSFER_OUT':
      return 'Перевод →'
    case 'TRANSFER_IN':
      return 'Перевод ←'
    default:
      return type
  }
}

export const normalizeDate = (value: Date) => {
  const normalized = new Date(value)

  normalized.setHours(0, 0, 0, 0)

  return normalized
}

export const toStartOfDayMs = (value: Date) => normalizeDate(value).getTime()

export const toEndOfDayMs = (value: Date) => {
  const end = new Date(value)

  end.setHours(23, 59, 59, 999)

  return end.getTime()
}

export const getStartOfCurrentQuarter = (today = new Date()) => {
  const normalized = normalizeDate(today)
  const quarterStartMonth = Math.floor(normalized.getMonth() / 3) * 3

  return new Date(normalized.getFullYear(), quarterStartMonth, 1)
}

export const getStartOfCurrentYear = (today = new Date()) => {
  const normalized = normalizeDate(today)

  return new Date(normalized.getFullYear(), 0, 1)
}

export const getQuickRangeDates = (
  range: SavingsQuickRange,
  today = new Date(),
) => {
  const dateTo = normalizeDate(today)
  const dateFrom =
    range === 'quarter'
      ? getStartOfCurrentQuarter(today)
      : getStartOfCurrentYear(today)

  return { dateFrom, dateTo }
}

const toDayKey = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const formatChartDayLabel = (value: Date) => {
  const dayMonth = value.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  })
  const weekday = value.toLocaleDateString('ru-RU', { weekday: 'short' })

  return `${dayMonth} ${weekday}`
}

const getOperationDayKey = (createdAt: string) => {
  const date = new Date(createdAt)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return toDayKey(normalizeDate(date))
}

const eachDayInclusive = (from: Date, to: Date): Date[] => {
  const days: Date[] = []
  const cursor = normalizeDate(from)
  const end = normalizeDate(to)

  if (cursor.getTime() > end.getTime()) {
    return days
  }

  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export const computeSavingsPeriodMetrics = (
  operations: SavingsOperation[],
  rates: RubRates | null,
  dateFrom: Date,
  dateTo: Date,
  envelopeIds?: Set<string>,
): SavingsPeriodMetrics => {
  const startMs = toStartOfDayMs(dateFrom)
  const endMs = toEndOfDayMs(dateTo)
  const relevant = envelopeIds
    ? operations.filter((operation) => envelopeIds.has(operation.envelope_id))
    : operations

  let balanceBefore = 0
  let change = 0
  let deposited = 0
  let withdrawn = 0
  const byDay = new Map<string, number>()

  for (const operation of relevant) {
    const createdMs = new Date(operation.created_at).getTime()

    if (Number.isNaN(createdMs)) {
      continue
    }

    const rub = toRub(operation, rates)

    if (createdMs < startMs) {
      balanceBefore += rub
      continue
    }

    if (createdMs > endMs) {
      continue
    }

    change += rub

    if (
      operation.operation_type === 'DEPOSIT' ||
      operation.operation_type === 'TRANSFER_IN'
    ) {
      deposited += rub
    }

    if (
      operation.operation_type === 'WITHDRAWAL' ||
      operation.operation_type === 'TRANSFER_OUT'
    ) {
      withdrawn += Math.abs(rub)
    }

    const dayKey = getOperationDayKey(operation.created_at)

    if (dayKey) {
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + rub)
    }
  }

  const days = eachDayInclusive(dateFrom, dateTo)
  let running = balanceBefore
  const chartLabels: string[] = []
  const chartValues: number[] = []

  for (const day of days) {
    running += byDay.get(toDayKey(day)) ?? 0
    chartLabels.push(formatChartDayLabel(day))
    chartValues.push(Math.round(running))
  }

  return {
    change: Math.round(change),
    deposited: Math.round(deposited),
    withdrawn: Math.round(withdrawn),
    chartLabels,
    chartValues,
  }
}
