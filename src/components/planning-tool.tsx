import { Calendar } from 'primereact/calendar'
import { Chart } from 'primereact/chart'
import { InputNumber } from 'primereact/inputnumber'
import { useEffect, useMemo, useState } from 'react'
import { getTransactions } from '../api'
import type { Transaction } from '../api/types'

const desiredMonthlyStorageKey = 'half_planning_desired_monthly'
const correctionDaysStorageKey = 'half_planning_correction_days'
const correctionStartDateStorageKey = 'half_planning_correction_start_date'
const excludedAnalyticsCategory = 'close_period'

const formatMoney = (value: number) =>
  value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })

const normalizeDate = (value: Date) => {
  const normalized = new Date(value)

  normalized.setHours(0, 0, 0, 0)

  return normalized
}

const toDateStorageValue = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const toStartOfDayIso = (value: Date) => {
  const normalized = normalizeDate(value)

  return normalized.toISOString()
}

const toEndOfDayIso = (value: Date) => {
  const normalized = new Date(value)

  normalized.setHours(23, 59, 59, 999)

  return normalized.toISOString()
}

const readStoredNumber = (key: string): number | null => {
  const raw = localStorage.getItem(key)

  if (raw === null || raw === '') {
    return null
  }

  const parsed = Number(raw)

  return Number.isFinite(parsed) ? parsed : null
}

const readStoredDate = (key: string): Date | null => {
  const raw = localStorage.getItem(key)

  if (raw === null || raw === '') {
    return null
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return normalizeDate(parsed)
}

const formatDate = (value: Date) => value.toLocaleDateString('ru-RU')

const formatChartDayLabel = (value: Date) => {
  const dayMonth = value.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  })
  const weekday = value.toLocaleDateString('ru-RU', { weekday: 'short' })

  return `${dayMonth} ${weekday}`
}

const mintPastBackgroundColor = '#D8F3E8'

const createPastThroughTodayBackgroundPlugin = (endIndex: number, dayCount: number) => ({
  id: 'pastThroughTodayBackground',
  beforeDraw(chart: {
    ctx: CanvasRenderingContext2D
    chartArea: { left: number; right: number; top: number; bottom: number } | undefined
    scales: { x?: { getPixelForValue: (value: number) => number } }
  }) {
    if (endIndex < 0 || dayCount === 0) {
      return
    }

    const { ctx, chartArea, scales } = chart
    const xScale = scales.x

    if (!xScale || !chartArea) {
      return
    }

    const right =
      endIndex === dayCount - 1
        ? chartArea.right
        : xScale.getPixelForValue(endIndex + 0.5)

    ctx.save()
    ctx.fillStyle = mintPastBackgroundColor
    ctx.fillRect(
      chartArea.left,
      chartArea.top,
      right - chartArea.left,
      chartArea.bottom - chartArea.top,
    )
    ctx.restore()
  },
})

const getPaymentDayKey = (paymentDate: string) => {
  const date = normalizeDate(new Date(paymentDate))

  return toDateStorageValue(date)
}

type PlanningToolProps = {
  projectedMonthlyExpenses: number | null
  payer: Transaction['payer']
}

export const PlanningTool = ({ projectedMonthlyExpenses, payer }: PlanningToolProps) => {
  const [desiredMonthly, setDesiredMonthly] = useState<number | null>(() =>
    readStoredNumber(desiredMonthlyStorageKey),
  )
  const [correctionStartDate, setCorrectionStartDate] = useState<Date | null>(
    () => readStoredDate(correctionStartDateStorageKey) ?? normalizeDate(new Date()),
  )
  const [correctionDays, setCorrectionDays] = useState<number | null>(() =>
    readStoredNumber(correctionDaysStorageKey),
  )
  const [periodTransactions, setPeriodTransactions] = useState<Transaction[]>([])

  const dailyBudget = useMemo(() => {
    if (projectedMonthlyExpenses === null) {
      return null
    }

    return Math.round(projectedMonthlyExpenses / 30)
  }, [projectedMonthlyExpenses])

  const correctionDailyBudget = useMemo(() => {
    if (
      projectedMonthlyExpenses === null ||
      desiredMonthly === null ||
      correctionDays === null ||
      correctionDays <= 0
    ) {
      return null
    }

    return Math.round(
      desiredMonthly / 30 - (projectedMonthlyExpenses - desiredMonthly) / correctionDays,
    )
  }, [projectedMonthlyExpenses, desiredMonthly, correctionDays])

  const extrapolatedMonthly = useMemo(() => {
    if (correctionDailyBudget === null) {
      return null
    }

    return correctionDailyBudget * 30
  }, [correctionDailyBudget])

  const periodDates = useMemo(() => {
    if (!correctionStartDate || correctionDays === null || correctionDays <= 0) {
      return null
    }

    const start = normalizeDate(correctionStartDate)
    const end = new Date(start)
    end.setDate(end.getDate() + correctionDays)

    return { start, end }
  }, [correctionStartDate, correctionDays])

  const chartDays = useMemo(() => {
    if (!periodDates || correctionDays === null || correctionDays <= 0) {
      return []
    }

    return Array.from({ length: correctionDays }, (_, index) => {
      const day = new Date(periodDates.start)
      day.setDate(day.getDate() + index)

      return normalizeDate(day)
    })
  }, [periodDates, correctionDays])

  useEffect(() => {
    if (!periodDates) {
      setPeriodTransactions([])
      return
    }

    let isActive = true

    const loadPeriodTransactions = async () => {
      const lastInclusiveDay = new Date(periodDates.end)
      lastInclusiveDay.setDate(lastInclusiveDay.getDate() - 1)

      const data = await getTransactions({
        from: toStartOfDayIso(periodDates.start),
        to: toEndOfDayIso(lastInclusiveDay),
      })

      if (!isActive) {
        return
      }

      setPeriodTransactions(data)
    }

    void loadPeriodTransactions()

    return () => {
      isActive = false
    }
  }, [periodDates])

  const extrapolatedAverageSpend = useMemo(() => {
    if (chartDays.length === 0) {
      return null
    }

    const todayTime = normalizeDate(new Date()).getTime()
    const pastDays = chartDays.filter((day) => day.getTime() < todayTime)

    if (pastDays.length === 0) {
      return null
    }

    const actualByDay = new Map<string, number>()

    for (const transaction of periodTransactions) {
      if (transaction.category === excludedAnalyticsCategory) {
        continue
      }

      const dayKey = getPaymentDayKey(transaction.payment_date)
      const amountForSelectedUser = payer === 'max' ? transaction.on_max : transaction.on_sasha

      actualByDay.set(dayKey, (actualByDay.get(dayKey) ?? 0) + amountForSelectedUser)
    }

    const pastSum = pastDays.reduce(
      (sum, day) => sum + (actualByDay.get(toDateStorageValue(day)) ?? 0),
      0,
    )

    return pastSum / pastDays.length
  }, [chartDays, payer, periodTransactions])

  const chartData = useMemo(() => {
    if (correctionDailyBudget === null || chartDays.length === 0) {
      return null
    }

    const actualByDay = new Map<string, number>()

    for (const transaction of periodTransactions) {
      if (transaction.category === excludedAnalyticsCategory) {
        continue
      }

      const dayKey = getPaymentDayKey(transaction.payment_date)
      const amountForSelectedUser = payer === 'max' ? transaction.on_max : transaction.on_sasha

      actualByDay.set(dayKey, (actualByDay.get(dayKey) ?? 0) + amountForSelectedUser)
    }

    const labels = chartDays.map((day) => formatChartDayLabel(day))
    const plannedValues = chartDays.map(() => correctionDailyBudget)
    const today = normalizeDate(new Date())
    const todayTime = today.getTime()
    const actualValues = chartDays.map((day) => {
      if (day.getTime() > todayTime) {
        return null
      }

      return actualByDay.get(toDateStorageValue(day)) ?? 0
    })

    const datasets: Array<{
      label: string
      data: (number | null)[]
      borderColor: string
      backgroundColor: string
      tension: number
      pointRadius: number
      borderWidth: number
      borderDash?: number[]
    }> = [
      {
        label: 'Запланированный дневной бюджет',
        data: plannedValues,
        borderColor: '#42A5F5',
        backgroundColor: '#42A5F5',
        tension: 0,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Фактические траты',
        data: actualValues,
        borderColor: '#EF5350',
        backgroundColor: '#EF5350',
        tension: 0.2,
        pointRadius: 3,
        borderWidth: 2,
      },
    ]

    if (extrapolatedAverageSpend !== null) {
      datasets.push({
        label: 'Экстраполированный средний расход',
        data: chartDays.map(() => extrapolatedAverageSpend),
        borderColor: '#EF5350',
        backgroundColor: '#EF5350',
        tension: 0,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [6, 4],
      })
    }

    return {
      labels,
      datasets,
    }
  }, [chartDays, correctionDailyBudget, extrapolatedAverageSpend, payer, periodTransactions])

  const chartOptions = useMemo(() => {
    const documentStyle = getComputedStyle(document.documentElement)
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057'
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dee2e6'
    const todayTime = normalizeDate(new Date()).getTime()
    const todayIndex = chartDays.findIndex((day) => day.getTime() === todayTime)

    return {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: (ctx: { index: number }) =>
              ctx.index === todayIndex ? '#212121' : textColor,
            font: (ctx: { index: number }) =>
              ctx.index === todayIndex ? { weight: 'bold' as const } : { weight: 'normal' as const },
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
          },
          grid: {
            color: surfaceBorder,
          },
          title: {
            display: true,
            text: 'руб',
            color: textColor,
          },
        },
      },
    }
  }, [chartDays])

  const chartPlugins = useMemo(() => {
    const todayTime = normalizeDate(new Date()).getTime()
    let endIndex = -1

    for (let index = chartDays.length - 1; index >= 0; index -= 1) {
      if (chartDays[index].getTime() <= todayTime) {
        endIndex = index
        break
      }
    }

    return [createPastThroughTodayBackgroundPlugin(endIndex, chartDays.length)]
  }, [chartDays])

  const handleDesiredMonthlyChange = (value: number | null) => {
    setDesiredMonthly(value)

    if (value === null) {
      localStorage.removeItem(desiredMonthlyStorageKey)
      return
    }

    localStorage.setItem(desiredMonthlyStorageKey, String(value))
  }

  const handleCorrectionStartDateChange = (value: Date | null) => {
    const nextValue = value ? normalizeDate(value) : null

    setCorrectionStartDate(nextValue)

    if (nextValue === null) {
      localStorage.removeItem(correctionStartDateStorageKey)
      return
    }

    localStorage.setItem(correctionStartDateStorageKey, toDateStorageValue(nextValue))
  }

  const handleCorrectionDaysChange = (value: number | null) => {
    setCorrectionDays(value)

    if (value === null) {
      localStorage.removeItem(correctionDaysStorageKey)
      return
    }

    localStorage.setItem(correctionDaysStorageKey, String(value))
  }

  return (
    <div className="mt-8">
      <h1 className="text-3xl font-bold m-0 mb-4">Инструмент планирования</h1>

      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <div className="text-5xl font-bold">
            {projectedMonthlyExpenses !== null
              ? `${formatMoney(projectedMonthlyExpenses)} руб`
              : '—'}
          </div>
          <div className="mt-2 text-sm text-surface-600">среднемесячный расход (факт)</div>
        </div>
        <div>
          <div className="text-5xl font-bold">
            {dailyBudget !== null ? `${formatMoney(dailyBudget)} руб` : '—'}
          </div>
          <div className="mt-2 text-sm text-surface-600">бюджет дня (факт)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="planning-desired-monthly">Желаемый месячный расход</label>
          <InputNumber
            inputId="planning-desired-monthly"
            value={desiredMonthly}
            onChange={(e) => handleDesiredMonthlyChange(e.value ?? null)}
            mode="decimal"
            minFractionDigits={0}
            maxFractionDigits={0}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label htmlFor="planning-correction-days">Период коррекции к плану (дни)</label>
          <InputNumber
            inputId="planning-correction-days"
            value={correctionDays}
            onChange={(e) => handleCorrectionDaysChange(e.value ?? null)}
            mode="decimal"
            min={1}
            minFractionDigits={0}
            maxFractionDigits={0}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="planning-correction-start-date">Дата начала периода</label>
          <Calendar
            inputId="planning-correction-start-date"
            value={correctionStartDate}
            onChange={(e) => handleCorrectionStartDateChange(e.value ?? null)}
            dateFormat="dd.mm.yy"
            showIcon
            className="w-full"
          />
        </div>
      </div>

      {correctionDailyBudget !== null && extrapolatedMonthly !== null && periodDates ? (
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="text-5xl font-bold">{formatMoney(extrapolatedMonthly)} руб</div>
              <div className="mt-2 text-sm text-surface-600">
                экстраполированный месячный бюджет на период коррекции
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold">{formatMoney(correctionDailyBudget)} руб</div>
              <div className="mt-2 text-sm text-surface-600">
                дневной бюджет на период коррекции
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-2xl font-bold">
              {formatDate(periodDates.start)} — {formatDate(periodDates.end)}
            </div>
            <div className="mt-2 pb-5 text-sm text-surface-600">даты периода коррекции</div>
          </div>
          {chartData && (
            <div className="mt-6 pb-5">
              <h2 className="mb-4 text-xl font-semibold">Период коррекции</h2>
              <div className="h-80">
                <Chart
                  type="line"
                  data={chartData}
                  options={chartOptions}
                  plugins={chartPlugins}
                  className="h-full w-full"
                />
              </div>
              {extrapolatedAverageSpend !== null && (
                <div className="mt-6">
                  <div className="text-5xl font-bold">
                    {formatMoney(extrapolatedAverageSpend)} руб
                  </div>
                  <div className="mt-2 text-sm text-surface-600">
                    экстраполированный средний расход
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 text-sm text-surface-600">Недостаточно данных для расчёта</div>
      )}
    </div>
  )
}
