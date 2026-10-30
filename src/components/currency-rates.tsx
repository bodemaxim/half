import { Checkbox } from 'primereact/checkbox'
import { InputNumber } from 'primereact/inputnumber'
import { Panel } from 'primereact/panel'
import {
  type CurrencyCode,
  type CurrencyFeeKind,
  type CurrencyRateView,
} from '../api/currency'

const formatRateDate = (value: string) => {
  const [year, month, day] = value.split('-')

  if (!year || !month || !day) {
    return value
  }

  return `${day}.${month}.${year}`
}

type CurrencyRatesProps = {
  views: CurrencyRateView[]
  loading: boolean
  date?: string
  selectedCode: CurrencyCode | null
  onSelect: (code: CurrencyCode | null) => void
  showFeeCheckbox?: boolean
  feeKind?: CurrencyFeeKind
  customFeePercent?: number | null
  onFeeKindChange?: (kind: CurrencyFeeKind) => void
  onCustomFeePercentChange?: (value: number | null) => void
}

export const CurrencyRates = ({
  views,
  loading,
  date,
  selectedCode,
  onSelect,
  showFeeCheckbox = false,
  feeKind = 'none',
  customFeePercent = null,
  onFeeKindChange,
  onCustomFeePercentChange,
}: CurrencyRatesProps) => {
  const toggleFeeKind = (kind: Exclude<CurrencyFeeKind, 'none'>) => {
    onFeeKindChange?.(feeKind === kind ? 'none' : kind)
  }
  return (
    <Panel header="Валюта" className="w-full mt-10">
      {loading ? (
        <div className="text-sm text-surface-600">Загрузка курсов…</div>
      ) : views.length === 0 ? (
        <div className="text-sm text-surface-600">Курсы недоступны</div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {views.map((view) => {
              const selected = view.code === selectedCode

              return (
                <button
                  key={view.code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(selected ? null : view.code)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors ${
                    selected
                      ? 'border-green-500 bg-green-100'
                      : 'border-surface-200 bg-surface-50 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="text-xs uppercase tracking-wide text-surface-500">
                    {view.label}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-surface-900">
                    {view.text}
                  </div>
                </button>
              )
            })}
          </div>

          {showFeeCheckbox && selectedCode !== null && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  inputId="include_currency_fee_45"
                  checked={feeKind === '4.5'}
                  onChange={() => toggleFeeKind('4.5')}
                />
                <label
                  htmlFor="include_currency_fee_45"
                  className="cursor-pointer select-none text-sm text-neutral-800"
                >
                  Накинуть 4.5% чтобы учесть комиссии
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  inputId="include_currency_fee_23"
                  checked={feeKind === '2.3'}
                  onChange={() => toggleFeeKind('2.3')}
                />
                <label
                  htmlFor="include_currency_fee_23"
                  className="cursor-pointer select-none text-sm text-neutral-800"
                >
                  Накинуть 2.3% чтобы учесть комиссии
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  inputId="include_currency_fee_custom"
                  checked={feeKind === 'custom'}
                  onChange={() => toggleFeeKind('custom')}
                />
                <label
                  htmlFor="include_currency_fee_custom"
                  className="cursor-pointer select-none text-sm text-neutral-800"
                >
                  Накинуть своё значение
                </label>
                <InputNumber
                  inputId="currency_fee_custom_percent"
                  value={customFeePercent}
                  onValueChange={(e) =>
                    onCustomFeePercentChange?.(e.value ?? null)
                  }
                  min={0}
                  maxFractionDigits={2}
                  suffix=" %"
                  className="w-28"
                />
              </div>
            </div>
          )}

          {date && (
            <div className="text-xs text-surface-500">
              Курс на {formatRateDate(date)} · Frankfurter
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
