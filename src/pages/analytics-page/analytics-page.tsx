import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Tag } from 'primereact/tag'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTransactions } from '../../api'
import { enumConfig } from '../../api/consts'
import type { CategoryExpenses, Transaction } from '../../api/types'
import { CategoryExpensesDonut } from '../../components/category-expenses-donut'
import { InfoWidget } from '../../components/info-widget'

const toStartOfDayIso = (value: Date) => {
  const normalized = new Date(value)

  normalized.setHours(0, 0, 0, 0)

  return normalized.toISOString()
}

const toEndOfDayIso = (value: Date) => {
  const normalized = new Date(value)

  normalized.setHours(23, 59, 59, 999)

  return normalized.toISOString()
}

const getDefaultDateRange = () => {
  const today = new Date()
  const monthAgo = new Date(today)

  monthAgo.setMonth(monthAgo.getMonth() - 1)

  return {
    dateFrom: monthAgo,
    dateTo: today,
  }
}

type DateRange = {
  dateFrom: Date | null
  dateTo: Date | null
}

type QuickRange = 'week' | 'twoWeeks' | 'month'

type AnalyticsPageProps = {
  payer: Transaction['payer'] | null
}

const createEmptyCategoryExpenses = (): CategoryExpenses =>
  Object.fromEntries(enumConfig.categories.map((category) => [category.value, 0])) as CategoryExpenses

const formatMoney = (value: number) =>
  value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })

const quickRangeOptions: Array<{ value: QuickRange; label: string }> = [
  { value: 'week', label: 'неделя' },
  { value: 'twoWeeks', label: '2 недели' },
  { value: 'month', label: 'месяц' },
]

const normalizeDate = (value: Date) => {
  const normalized = new Date(value)

  normalized.setHours(0, 0, 0, 0)

  return normalized
}

const getDateFromByQuickRange = (range: QuickRange, dateTo: Date) => {
  const dateFrom = normalizeDate(dateTo)

  if (range === 'week') {
    dateFrom.setDate(dateFrom.getDate() - 6)
  }

  if (range === 'twoWeeks') {
    dateFrom.setDate(dateFrom.getDate() - 13)
  }

  if (range === 'month') {
    dateFrom.setMonth(dateFrom.getMonth() - 1)
  }

  return dateFrom
}

export const AnalyticsPage = ({ payer }: AnalyticsPageProps) => {
  const navigate = useNavigate()
  const [{ dateFrom, dateTo }, setDateRange] = useState<DateRange>(getDefaultDateRange)
  const [selectedQuickRange, setSelectedQuickRange] = useState<QuickRange | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const selectedQuickDateTo = useMemo(() => {
    if (!dateTo) {
      return null
    }

    const normalizedDateTo = normalizeDate(dateTo).getTime()
    const today = normalizeDate(new Date()).getTime()
    const yesterdayDate = normalizeDate(new Date())

    yesterdayDate.setDate(yesterdayDate.getDate() - 1)

    if (normalizedDateTo === today) {
      return 'today'
    }

    if (normalizedDateTo === yesterdayDate.getTime()) {
      return 'yesterday'
    }

    return null
  }, [dateTo])

  const applyQuickRange = (range: QuickRange) => {
    const nextDateTo =
      selectedQuickDateTo !== null && dateTo ? normalizeDate(dateTo) : normalizeDate(new Date())
    const nextDateFrom = getDateFromByQuickRange(range, nextDateTo)

    setDateRange({ dateFrom: nextDateFrom, dateTo: nextDateTo })
    setSelectedQuickRange(range)
  }

  const handleDateChange = (field: keyof DateRange, value: Date | null) => {
    setDateRange((prev) => ({ ...prev, [field]: value }))
    setSelectedQuickRange(null)
  }

  const applyQuickDateTo = (daysOffset: number) => {
    const nextDateTo = normalizeDate(new Date())

    nextDateTo.setDate(nextDateTo.getDate() - daysOffset)

    setDateRange((prev) => ({
      dateFrom:
        selectedQuickRange !== null ? getDateFromByQuickRange(selectedQuickRange, nextDateTo) : prev.dateFrom,
      dateTo: nextDateTo,
    }))
  }

  useEffect(() => {
    let isActive = true

    const loadTransactions = async () => {
      const data = await getTransactions({
        from: dateFrom ? toStartOfDayIso(dateFrom) : undefined,
        to: dateTo ? toEndOfDayIso(dateTo) : undefined,
      })

      if (!isActive) {
        return
      }

      setTransactions(data)
      console.log('Transactions filtered by period:', data)
    }

    void loadTransactions()

    return () => {
      isActive = false
    }
  }, [dateFrom, dateTo])

  const expensesByCategory = useMemo(() => {
    const totals = createEmptyCategoryExpenses()

    if (!payer) {
      return totals
    }

    for (const transaction of transactions) {
      if (!enumConfig.categories.some((category) => category.value === transaction.category)) {
        continue
      }

      const amountForSelectedUser =
        payer === 'max' ? transaction.on_max : transaction.on_sasha

      totals[transaction.category as keyof CategoryExpenses] += amountForSelectedUser
    }

    return totals
  }, [payer, transactions])

  const totalExpenses = useMemo(
    () => Object.values(expensesByCategory).reduce((sum, value) => sum + value, 0),
    [expensesByCategory],
  )

  const projectedMonthlyExpenses = useMemo(() => {
    if (!dateFrom || !dateTo) {
      return null
    }

    const millisecondsInDay = 1000 * 60 * 60 * 24
    const startDate = new Date(dateFrom)
    const endDate = new Date(dateTo)

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)

    const daysInSelectedPeriod =
      Math.floor((endDate.getTime() - startDate.getTime()) / millisecondsInDay) + 1

    if (daysInSelectedPeriod <= 0) {
      return null
    }

    return Math.round((totalExpenses / daysInSelectedPeriod) * 30)
  }, [dateFrom, dateTo, totalExpenses])

  return (
    <div className="h-dvh p-5">
      <div className="w-full md:w-1/2 mx-auto">
        <div className="flex-b">
          <h1 className="text-3xl font-bold m-0  mb-4">Аналитика</h1>
          <Button
            icon="pi pi-backward"
            rounded
            text
            aria-label="На главную"
            className="transform translate-x-[16px]"
            onClick={() => navigate('/home')}
          />
        </div>
        {payer && (
          <div className="mb-6">
            <InfoWidget
              className="inline-block pr-8"
              tooltip={
                projectedMonthlyExpenses !== null ? (
                  <span>
                    Экстраполируя на 30 дней, получится {' '}
                    <b>{formatMoney(projectedMonthlyExpenses)}</b> руб
                  </span>
                ) : (
                  'Недостаточно данных для прогноза'
                )
              }
            >
              <div className="text-5xl font-bold">{formatMoney(totalExpenses)} руб</div>
            </InfoWidget>
            <div className="mt-2 text-sm text-surface-600">потрачено за указанный период</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="analytics-date-from">Дата от</label>
            <Calendar
              inputId="analytics-date-from"
              value={dateFrom}
              onChange={(e) => handleDateChange('dateFrom', e.value ?? null)}
              dateFormat="dd.mm.yy"
              showIcon
              className="w-full"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {quickRangeOptions.map((option) => (
                <Tag
                  key={option.value}
                  value={option.label}
                  severity={selectedQuickRange === option.value ? 'success' : 'secondary'}
                  rounded
                  onClick={() => applyQuickRange(option.value)}
                  className="cursor-pointer select-none"
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="analytics-date-to">Дата до</label>
            <Calendar
              inputId="analytics-date-to"
              value={dateTo}
              onChange={(e) => handleDateChange('dateTo', e.value ?? null)}
              dateFormat="dd.mm.yy"
              showIcon
              className="w-full"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag
                value="сегодня"
                severity={selectedQuickDateTo === 'today' ? 'success' : 'secondary'}
                rounded
                onClick={() => applyQuickDateTo(0)}
                className="cursor-pointer select-none"
              />
              <Tag
                value="вчера"
                severity={selectedQuickDateTo === 'yesterday' ? 'success' : 'secondary'}
                rounded
                onClick={() => applyQuickDateTo(1)}
                className="cursor-pointer select-none"
              />
            </div>
          </div>
        </div>
        
        {payer ? (
          <CategoryExpensesDonut data={expensesByCategory} />
        ) : (
          <div className="mt-6 rounded-xl border border-surface-200 p-4">
            Выбери пользователя на главной странице, чтобы посмотреть аналитику.
          </div>
        )}
      </div>
    </div>
  )
}
