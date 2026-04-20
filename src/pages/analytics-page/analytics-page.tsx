import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTransactions } from '../../api'
import { enumConfig } from '../../api/consts'
import type { CategoryExpenses, Transaction } from '../../api/types'
import { CategoryExpensesDonut } from '../../components/category-expenses-donut'

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

type AnalyticsPageProps = {
  payer: Transaction['payer'] | null
}

const createEmptyCategoryExpenses = (): CategoryExpenses =>
  Object.fromEntries(enumConfig.categories.map((category) => [category.value, 0])) as CategoryExpenses

const formatMoney = (value: number) =>
  value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })

export const AnalyticsPage = ({ payer }: AnalyticsPageProps) => {
  const navigate = useNavigate()
  const [{ dateFrom, dateTo }, setDateRange] = useState<DateRange>(getDefaultDateRange)
  const [transactions, setTransactions] = useState<Transaction[]>([])

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
            <div className="text-5xl font-bold">{formatMoney(totalExpenses)} руб</div>
            <div className="mt-2 text-sm text-surface-600">потрачено за указанный период</div>
          </div>
        )}
        <div className="flex-b space-x-4">
          <div className="flex flex-col gap-2 w-1/2">
            <label htmlFor="analytics-date-from">Дата от</label>
            <Calendar
              inputId="analytics-date-from"
              value={dateFrom}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, dateFrom: e.value ?? null }))
              }
              dateFormat="dd.mm.yy"
              showIcon
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2  w-1/2">
            <label htmlFor="analytics-date-to">Дата до</label>
            <Calendar
              inputId="analytics-date-to"
              value={dateTo}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, dateTo: e.value ?? null }))
              }
              dateFormat="dd.mm.yy"
              showIcon
              className="w-full"
            />
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
