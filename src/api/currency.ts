import { useEffect, useState } from 'react'
import { getRubRates, type RubRates } from './frankfurter'

export const trackedCurrencies = [
  { code: 'USD', label: 'Доллар', inForm: 'в долларах', direction: 'rubPerUnit' },
  { code: 'EUR', label: 'Евро', inForm: 'в евро', direction: 'rubPerUnit' },
  { code: 'AMD', label: 'Драм', inForm: 'в драмах', direction: 'unitPerRub' },
  { code: 'RSD', label: 'Динар', inForm: 'в динарах', direction: 'rubPerUnit' },
] as const

export type CurrencyCode = (typeof trackedCurrencies)[number]['code']

export type CurrencyOption = (typeof trackedCurrencies)[number]

export const getCurrencyOption = (
  code: CurrencyCode | null,
): CurrencyOption | null =>
  trackedCurrencies.find((currency) => currency.code === code) ?? null

const selectedCurrencyStorageKey = 'half_selected_currency'

const isCurrencyCode = (value: string): value is CurrencyCode =>
  trackedCurrencies.some((currency) => currency.code === value)

/** Выбранная валюта из localStorage; null → суммы в рублях. */
export const readStoredCurrency = (): CurrencyCode | null => {
  const raw = localStorage.getItem(selectedCurrencyStorageKey)

  return raw !== null && isCurrencyCode(raw) ? raw : null
}

export const storeCurrency = (code: CurrencyCode | null) => {
  if (code === null) {
    localStorage.removeItem(selectedCurrencyStorageKey)

    return
  }

  localStorage.setItem(selectedCurrencyStorageKey, code)
}

const formatNumber = (value: number) =>
  value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })

export type CurrencyRateView = {
  code: CurrencyCode
  label: string
  text: string
  /** Сколько рублей стоит 1 единица валюты */
  rubPerUnit: number
}

export const buildCurrencyRateViews = (
  rates: RubRates | null,
): CurrencyRateView[] => {
  const rateViews: CurrencyRateView[] = []

  for (const currency of trackedCurrencies) {
    const rubPerUnit = rates?.rubPerUnit[currency.code]

    if (rubPerUnit === undefined || rubPerUnit <= 0) continue

    if (currency.direction === 'rubPerUnit') {
      rateViews.push({
        code: currency.code,
        label: currency.label,
        rubPerUnit,
        text: `1 ${currency.code} = ${formatNumber(rubPerUnit)} ₽`,
      })

      continue
    }

    // Для мелких валют привычнее обратный курс: сколько единиц валюты в рубле.
    rateViews.push({
      code: currency.code,
      label: currency.label,
      rubPerUnit,
      text: `1 ₽ = ${formatNumber(1 / rubPerUnit)} ${currency.code}`,
    })
  }

  return rateViews
}

export const useRubRates = () => {
  const [rates, setRates] = useState<RubRates | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const data = await getRubRates(trackedCurrencies.map(({ code }) => code))

      if (cancelled) return

      setRates(data)
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return { rates, loading }
}