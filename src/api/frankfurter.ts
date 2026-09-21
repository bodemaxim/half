const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev'

export type FrankfurterRate = {
  date: string
  base: string
  quote: string
  rate: number
}

export type RubRates = {
  /** Дата, на которую актуален курс (ISO, YYYY-MM-DD) */
  date: string
  /** Сколько рублей стоит 1 единица валюты (ключ — код валюты) */
  rubPerUnit: Record<string, number>
}

/**
 * Курсы валют к рублю по данным Frankfurter (https://frankfurter.dev/).
 * Возвращает null, если запрос не удался.
 */
export const getRubRates = async (quotes: string[]): Promise<RubRates | null> => {
  const params = new URLSearchParams({ base: 'RUB', quotes: quotes.join(',') })

  try {
    const response = await fetch(
      `${FRANKFURTER_BASE_URL}/v2/rates?${params.toString()}`,
    )

    if (!response.ok) {
      throw new Error(`Frankfurter ответил ${response.status}`)
    }

    const data = (await response.json()) as FrankfurterRate[]

    if (!Array.isArray(data) || data.length === 0) {
      return null
    }

    const rubPerUnit: Record<string, number> = {}

    for (const item of data) {
      // base=RUB → item.rate = сколько единиц валюты стоит 1 рубль
      if (!Number.isFinite(item.rate) || item.rate <= 0) continue

      rubPerUnit[item.quote] = 1 / item.rate
    }

    return { date: data[0]?.date ?? '', rubPerUnit }
  } catch (e) {
    console.error('getRubRates failed:', e)

    return null
  }
}