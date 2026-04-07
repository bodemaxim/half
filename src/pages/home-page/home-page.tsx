import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { FloatLabel } from 'primereact/floatlabel'
import { enumConfig } from '../../api/consts'
import type { Transaction } from '../../api/types'

type HomePageProps = {
  payer: Transaction['payer'] | null
  setPayer: Dispatch<SetStateAction<Transaction['payer'] | null>>
  transactions: Transaction[]
}

export const HomePage = ({ payer, setPayer, transactions }: HomePageProps) => {
  const navigate = useNavigate()
  const selectedUserStorageKey = 'half_selected_user'

  useEffect(() => {
    const savedUser = localStorage.getItem(selectedUserStorageKey)

    if (savedUser && enumConfig.users.some((option) => option.value === savedUser)) {
      setPayer(savedUser as Transaction['payer'])
    }
  }, [setPayer])

  const formatMoney = (value: number) =>
    value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })

  const formatPeriodStartDate = (value: string | null) => {
    if (!value) return ''

    try {
      const zdt = Temporal.Instant.from(value).toZonedDateTimeISO('UTC')
      const day = String(zdt.day).padStart(2, '0')
      const month = String(zdt.month).padStart(2, '0')
      const year = String(zdt.year).slice(-2)

      return `${day}.${month}.${year}`
    } catch {
      return value
    }
  }

  const currentPeriodStart =
    typeof transactions[0]?.tracking_start_date === 'string'
      ? transactions[0].tracking_start_date
      : null

  const spentForCurrentPeriod = (() => {
    if (!currentPeriodStart) {
      return { onSasha: 0, onMax: 0, realSasha: 0, realMax: 0 }
    }

    const startMs = new Date(currentPeriodStart).getTime()
    const nowMs = new Date().getTime()

    let onSasha = 0
    let onMax = 0
    let realSasha = 0
    let realMax = 0

    for (const t of transactions) {
      if (t.type !== 'purchase') continue
      if (!t.tracking_start_date) continue

      const tStartMs = new Date(t.tracking_start_date).getTime()
      // "Текущий период" для транзакции: от start_period до настоящего момента.
      // Т.е. учитываем только транзакции, чей start_period попадает в текущий период.
      if (tStartMs !== startMs) continue
      // Помимо match по start_period, на всякий случай проверим дату платежа.
      const paymentMs = new Date(t.payment_date).getTime()
      if (Number.isNaN(paymentMs)) continue
      if (paymentMs < startMs || paymentMs > nowMs) continue

      onMax += t.on_max
      onSasha += t.on_sasha

      if (t.payer === 'sasha') realSasha += t.amount
      if (t.payer === 'max') realMax += t.amount
    }

    return { onSasha, onMax, realSasha, realMax }
  })()

  const closingPeriodGapSasha = Math.abs(
    spentForCurrentPeriod.realSasha - spentForCurrentPeriod.onSasha,
  )
  const closingPeriodGapMax = Math.abs(
    spentForCurrentPeriod.realMax - spentForCurrentPeriod.onMax,
  )

  /** Выбранный пользователь должен перевести второму (кнопка «Закрыть период» активна). */
  const selectedUserOwesOther =
    Boolean(currentPeriodStart) &&
    (payer === 'sasha'
      ? spentForCurrentPeriod.realSasha < spentForCurrentPeriod.onSasha
      : payer === 'max'
        ? spentForCurrentPeriod.realMax < spentForCurrentPeriod.onMax
        : false)

  const payerLabel =
    payer === null
      ? ''
      : enumConfig.users.find((u) => u.value === payer)?.label ?? payer

  const closingPeriodPrompt =
    payer === 'sasha'
      ? spentForCurrentPeriod.realSasha < spentForCurrentPeriod.onSasha
        ? `Чтобы закрыть период, переведи ${formatMoney(closingPeriodGapSasha)} руб`
        : spentForCurrentPeriod.realSasha > spentForCurrentPeriod.onSasha
          ? `Чтобы закрыть период, дождись перевода ${formatMoney(closingPeriodGapSasha)} руб`
          : null
      : payer === 'max'
        ? spentForCurrentPeriod.realMax < spentForCurrentPeriod.onMax
          ? `Чтобы закрыть период, переведи ${formatMoney(closingPeriodGapMax)} руб`
          : spentForCurrentPeriod.realMax > spentForCurrentPeriod.onMax
            ? `Чтобы закрыть период, дождись перевода ${formatMoney(closingPeriodGapMax)} руб`
            : null
        : null

  return (
    <div className="p-5 h-dvh flex flex-col">
      <div className="flex-1">
        <h1 className="text-3xl font-bold my-5 text-center mb-10">{payerLabel}</h1>
        <div className="w-full md:w-1/2 mb-5 mx-auto">
          <Button
            severity="success"
            label="Создать"
            onClick={() => {
              if (!payer) {
                alert('Сначала выберите пользователя')

                return
              }

              navigate('/new')
            }}
            className="w-full mt-2"
          />
        </div>
        <div className="w-full md:w-1/2 mb-5 mx-auto">
          <Button
            severity="info"
            label="Транзакции"
            onClick={() => navigate('/transactions')}
            className="w-full  mt-2"
          />
        </div>
        <div className="w-full md:w-1/2 mb-5 mx-auto space-y-1">
          {payer === 'sasha' && (
            <>
              <div>Саша взяла на себя: {formatMoney(spentForCurrentPeriod.onSasha)}</div>
              <div>Саша реально потратила: {formatMoney(spentForCurrentPeriod.realSasha)}</div>
              {closingPeriodPrompt && <div>{closingPeriodPrompt}</div>}
            </>
          )}
          {payer === 'max' && (
            <>
              <div>Макс взял на себя: {formatMoney(spentForCurrentPeriod.onMax)}</div>
              <div>Макс реально потратил: {formatMoney(spentForCurrentPeriod.realMax)}</div>
              {closingPeriodPrompt && <div>{closingPeriodPrompt}</div>}
            </>
          )}
          <div>Начало периода: {formatPeriodStartDate(currentPeriodStart)}</div>
        </div>
        <div className="w-full md:w-1/2 mb-5 mx-auto">
          <Button
            severity="warning"
            label="Закрыть период"
            disabled={!selectedUserOwesOther}
            onClick={() =>
              navigate('/close-period', {
                state: {
                  amount:
                    payer === 'sasha'
                      ? closingPeriodGapSasha
                      : payer === 'max'
                        ? closingPeriodGapMax
                        : 0,
                  trackingStartDate: currentPeriodStart,
                },
              })
            }
            className="w-full  mt-2"
          />
        </div>
      </div>
      <div className="w-full md:w-1/2 mt-20 mb-5 mx-auto">
        <FloatLabel className="w-full">
          <Dropdown
            inputId="user-select"
            value={payer}
            onChange={(e) => {
              setPayer(e.value as Transaction['payer'])
              localStorage.setItem(selectedUserStorageKey, e.value)
            }}
            options={[...enumConfig.users]}
            placeholder="Выберите пользователя"
            className="w-full"
          />
          <label htmlFor="user-select">Пользователь</label>
        </FloatLabel>
      </div>
      <p
        className="mt-10 cursor-pointer text-blue-500 underline text-center"
        onClick={() => {
          localStorage.removeItem('half_password')
          navigate('/login')
        }}
      >
        Выйти
      </p>
    </div>
  )
}

