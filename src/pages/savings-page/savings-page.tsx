import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Chart } from 'primereact/chart'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEnvelopes, getSavingsOperations } from '../../api'
import { useRubRates } from '../../api/currency'
import type { Envelope, SavingsOperation } from '../../api/types'
import {
  computeSavingsPeriodMetrics,
  formatMoney,
  formatSignedMoney,
  getQuickRangeDates,
  normalizeDate,
  toRub,
  type SavingsQuickRange,
} from './savings-utils'

type DateRange = {
  dateFrom: Date | null
  dateTo: Date | null
}

const quickRangeOptions: Array<{ value: SavingsQuickRange; label: string }> = [
  { value: 'quarter', label: 'за текущий квартал' },
  { value: 'year', label: 'за текущий год' },
]

const getDefaultDateRange = (): DateRange & { quickRange: SavingsQuickRange } => {
  const { dateFrom, dateTo } = getQuickRangeDates('year')

  return { dateFrom, dateTo, quickRange: 'year' }
}

export const SavingsPage = () => {
  const navigate = useNavigate()
  const [operations, setOperations] = useState<SavingsOperation[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const { rates } = useRubRates()

  const defaults = getDefaultDateRange()
  const [{ dateFrom, dateTo }, setDateRange] = useState<DateRange>({
    dateFrom: defaults.dateFrom,
    dateTo: defaults.dateTo,
  })
  const [selectedQuickRange, setSelectedQuickRange] = useState<SavingsQuickRange | null>(
    defaults.quickRange,
  )

  useEffect(() => {
    void getSavingsOperations().then(setOperations)
    void getEnvelopes({ isActive: true }).then(setEnvelopes)
  }, [])

  const activeEnvelopeIds = useMemo(
    () => new Set(envelopes.map((envelope) => envelope.id)),
    [envelopes],
  )

  const activeOperations = useMemo(
    () => operations.filter((operation) => activeEnvelopeIds.has(operation.envelope_id)),
    [operations, activeEnvelopeIds],
  )

  const totalSavings = useMemo(
    () => activeOperations.reduce((sum, operation) => sum + toRub(operation, rates), 0),
    [activeOperations, rates],
  )

  const balanceByEnvelopeId = useMemo(() => {
    const balances: Record<string, number> = {}

    for (const operation of activeOperations) {
      balances[operation.envelope_id] =
        (balances[operation.envelope_id] ?? 0) + toRub(operation, rates)
    }

    return balances
  }, [activeOperations, rates])

  const periodMetrics = useMemo(() => {
    if (!dateFrom || !dateTo) {
      return null
    }

    return computeSavingsPeriodMetrics(
      operations,
      rates,
      normalizeDate(dateFrom),
      normalizeDate(dateTo),
    )
  }, [operations, rates, dateFrom, dateTo])

  const chartData = useMemo(() => {
    if (!periodMetrics) {
      return null
    }

    return {
      labels: periodMetrics.chartLabels,
      datasets: [
        {
          label: 'Баланс накоплений',
          data: periodMetrics.chartValues,
          borderColor: '#42A5F5',
          backgroundColor: '#42A5F5',
          tension: 0.2,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    }
  }, [periodMetrics])

  const chartOptions = useMemo(() => {
    const documentStyle = getComputedStyle(document.documentElement)
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057'
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dee2e6'

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
            color: textColor,
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
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
  }, [])

  const applyQuickRange = (range: SavingsQuickRange) => {
    const next = getQuickRangeDates(range)

    setDateRange(next)
    setSelectedQuickRange(range)
  }

  const handleDateChange = (field: keyof DateRange, value: Date | null) => {
    setDateRange((prev) => ({ ...prev, [field]: value }))
    setSelectedQuickRange(null)
  }

  const changeColorClass =
    periodMetrics === null
      ? ''
      : periodMetrics.change > 0
        ? 'text-green-600'
        : periodMetrics.change < 0
          ? 'text-red-500'
          : ''

  return (
    <div className="h-dvh p-5 overflow-y-auto">
      <div className="w-full md:w-1/2 mx-auto">
        <div className="flex-b">
          <h1 className="text-3xl font-bold m-0 mb-4">Накопления</h1>
          <Button
            icon="pi pi-backward"
            rounded
            text
            aria-label="На главную"
            className="transform translate-x-[16px]"
            onClick={() => navigate('/home')}
          />
        </div>
        <div className="mb-6">
          <div className="text-5xl font-bold">{formatMoney(totalSavings)} руб</div>
          <div className="mt-2 text-sm text-surface-600">накопления по всем конвертам</div>
        </div>

        <div className="mb-5">
          <Button
            severity="success"
            label="Создать конверт"
            className="w-full"
            onClick={() => navigate('/savings/new')}
          />
        </div>

        <DataTable
          value={envelopes}
          dataKey="id"
          size="small"
          className="text-sm"
          emptyMessage="Нет конвертов"
          rowClassName={() => 'cursor-pointer'}
          onRowClick={(e) =>
            navigate('/savings/view', {
              state: { envelopeId: (e.data as Envelope).id },
            })
          }
        >
          <Column field="name" header="Название" />
          <Column
            header="Баланс"
            body={(row: Envelope) =>
              `${formatMoney(balanceByEnvelopeId[row.id] ?? 0)} руб`
            }
          />
          <Column
            header=""
            style={{ width: '3.5rem' }}
            body={(row: Envelope) => (
              <Button
                icon="pi pi-pencil"
                rounded
                text
                aria-label="Редактировать"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/savings/edit', {
                    state: { envelopeId: row.id },
                  })
                }}
              />
            )}
          />
        </DataTable>

        <div className="mt-6 mb-10">
          <Button
            label="Неактивные конверты"
            rounded
            text
            className="w-full"
            onClick={() => navigate('/savings/inactive')}
          />
        </div>

        <div className="pb-10">
          <h2 className="mb-6 text-2xl font-bold m-0">Динамика накоплений</h2>

          {periodMetrics && (
            <div className="mb-6">
              <div className={`text-5xl font-bold ${changeColorClass}`}>
                {formatSignedMoney(periodMetrics.change)} руб
              </div>
              <div className="mt-2 text-sm text-surface-600">
                изменение накоплений за период
              </div>
            </div>
          )}

          {periodMetrics && (
            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <div className="text-5xl font-bold">
                  {formatMoney(periodMetrics.deposited)} руб
                </div>
                <div className="mt-2 text-sm text-surface-600">внесено за период</div>
              </div>
              <div>
                <div className="text-5xl font-bold">
                  {formatMoney(periodMetrics.withdrawn)} руб
                </div>
                <div className="mt-2 text-sm text-surface-600">снято за период</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="savings-date-from">Дата от</label>
              <Calendar
                inputId="savings-date-from"
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
              <label htmlFor="savings-date-to">Дата до</label>
              <Calendar
                inputId="savings-date-to"
                value={dateTo}
                onChange={(e) => handleDateChange('dateTo', e.value ?? null)}
                dateFormat="dd.mm.yy"
                showIcon
                className="w-full"
              />
            </div>
          </div>

          {chartData && (
            <div className="mt-8">
              <h3 className="mb-4 text-xl font-semibold m-0">Баланс по дням</h3>
              <div className="h-80">
                <Chart
                  type="line"
                  data={chartData}
                  options={chartOptions}
                  className="h-full w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
