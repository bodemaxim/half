import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { FloatLabel } from 'primereact/floatlabel'
import type { Transaction } from '../../api/types'

type HomePageProps = {
  payer: Transaction['payer'] | null
  setPayer: Dispatch<SetStateAction<Transaction['payer'] | null>>
  transactions: Transaction[]
}

export const HomePage = ({ payer, setPayer, transactions }: HomePageProps) => {
  const navigate = useNavigate()
  const selectedUserStorageKey = 'half_selected_user'

  const userOptions = [
    { label: 'Макс', value: 'max' },
    { label: 'Саша', value: 'sasha' },
  ]

  useEffect(() => {
    const savedUser = localStorage.getItem(selectedUserStorageKey)

    if (savedUser && userOptions.some((option) => option.value === savedUser)) {
      setPayer(savedUser as Transaction['payer'])
    }
  }, [setPayer])

  const formatMoney = (value: number) =>
    value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })

  const currentPeriodStart =
    typeof transactions[0]?.tracking_start_date === 'string'
      ? transactions[0].tracking_start_date
      : null

  const spentForCurrentPeriod = (() => {
    console.log(2, currentPeriodStart)
    if (!currentPeriodStart) return { onSasha: 0, onMax: 0 }

    const startMs = new Date(currentPeriodStart).getTime()
    const nowMs = new Date().getTime()

    let onSasha = 0
    let onMax = 0


    console.log(1, transactions)
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
    }

    return { onSasha, onMax }
  })()

  return (
    <div className="p-5 h-dvh flex flex-col">
      <div className="flex-1">
        <h1 className="text-3xl font-bold my-5 text-center mb-10">{payer}</h1>
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
            severity="secondary"
            label="Транзакции"
            onClick={() => navigate('/transactions')}
            className="w-full  mt-2"
          />
        </div>
        <div>
          <div>Потратили за текущий период</div>
          <div>Саша: {formatMoney(spentForCurrentPeriod.onSasha)}</div>
          <div>Макс: {formatMoney(spentForCurrentPeriod.onMax)}</div>
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
            options={userOptions}
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

