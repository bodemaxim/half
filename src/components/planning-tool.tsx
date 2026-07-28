import { InputNumber } from 'primereact/inputnumber'
import { useMemo, useState } from 'react'

const desiredMonthlyStorageKey = 'half_planning_desired_monthly'
const correctionDaysStorageKey = 'half_planning_correction_days'

const formatMoney = (value: number) =>
  value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })

const readStoredNumber = (key: string): number | null => {
  const raw = localStorage.getItem(key)

  if (raw === null || raw === '') {
    return null
  }

  const parsed = Number(raw)

  return Number.isFinite(parsed) ? parsed : null
}

const formatDate = (value: Date) => value.toLocaleDateString('ru-RU')

type PlanningToolProps = {
  projectedMonthlyExpenses: number | null
}

export const PlanningTool = ({ projectedMonthlyExpenses }: PlanningToolProps) => {
  const [desiredMonthly, setDesiredMonthly] = useState<number | null>(() =>
    readStoredNumber(desiredMonthlyStorageKey),
  )
  const [correctionDays, setCorrectionDays] = useState<number | null>(() =>
    readStoredNumber(correctionDaysStorageKey),
  )

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
    if (correctionDays === null || correctionDays <= 0) {
      return null
    }

    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(end.getDate() + correctionDays)

    return { start, end }
  }, [correctionDays])

  const handleDesiredMonthlyChange = (value: number | null) => {
    setDesiredMonthly(value)

    if (value === null) {
      localStorage.removeItem(desiredMonthlyStorageKey)
      return
    }

    localStorage.setItem(desiredMonthlyStorageKey, String(value))
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>
      ) : (
        <div className="mt-6 text-sm text-surface-600">Недостаточно данных для расчёта</div>
      )}
    </div>
  )
}
