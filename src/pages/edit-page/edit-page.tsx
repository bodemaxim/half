import { useState } from 'react'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { InputNumber } from 'primereact/inputnumber'
import { FloatLabel } from 'primereact/floatlabel'
import { InputTextarea } from 'primereact/inputtextarea'
import { Slider } from 'primereact/slider'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { createTransaction } from '../../api'
import type { Transaction } from '../../api/types'

type EditPageProps = {
  mode: 'new' | 'edit'
  payer?: Transaction['payer'] | null
  trackingStartDate?: Transaction['tracking_start_date']
}

export const EditPage = ({ mode, payer, trackingStartDate }: EditPageProps) => {
  const navigate = useNavigate()
  const [paymentDate, setPaymentDate] = useState<Date | null>(
    new Date(Temporal.Now.instant().epochMilliseconds),
  )
  const [amount, setAmount] = useState<number | null>(null)
  const [description, setDescription] = useState<string>('')
  const [onMax, setOnMax] = useState<number | null>(null)
  const [onSasha, setOnSasha] = useState<number | null>(null)
  const [sharePercent, setSharePercent] = useState<number>(50) // доля Макса в %

  return (
    <div className="p-5">
      <div className="flex-b">
        <h1 className="text-3xl font-bold my-5">
          {mode === 'new' ? 'Новая транзакция' : 'Редактирование транзакции'}
        </h1>
        <Button
          icon="pi pi-backward"
          rounded
          text
          aria-label="Назад"
          onClick={() => navigate('/home')}
        />
      </div>

      <div className="w-full md:w-1/2 mx-auto mt-10 space-y-5">
    
        <FloatLabel className="w-full">
          <Calendar
            id="payment_date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.value as Date | null)}
            showIcon
            hourFormat="24"
            showTime
            className="w-full"
          />
          <label htmlFor="payment_date">Дата платежа</label>
        </FloatLabel>


        <FloatLabel className="w-full mt-10">
          <InputNumber
            id="amount"
            value={amount ?? null}
            onValueChange={(e) => {
              const newAmount = e.value ?? null
              setAmount(newAmount)

              if (newAmount !== null) {
                const ratio = sharePercent / 100
                const maxPart = newAmount * ratio
                const sashaPart = newAmount - maxPart
                setOnMax(maxPart)
                setOnSasha(sashaPart)
              } else {
                setOnMax(null)
                setOnSasha(null)
              }
            }}
            mode="decimal"
            minFractionDigits={0}
            maxFractionDigits={0}
            className="w-full"
          />
          <label htmlFor="amount">Сумма</label>
        </FloatLabel>

        {amount !== null && (
          <>
            <div className="w-full flex-b mt-10">
<div className="flex-1 max-w-[calc(50%-8px)]">
              <FloatLabel className="flex-1">
                <InputNumber
                  inputId="on_max"
                  value={onMax}
                  onValueChange={(e) => {
                    const newOnMax = e.value ?? null
                    setOnMax(newOnMax)

                    if (amount !== null && newOnMax !== null) {
                      const newOnSasha = amount - newOnMax
                      setOnSasha(newOnSasha)

                      const ratio = amount === 0 ? 0 : (newOnMax / amount) * 100
                      setSharePercent(ratio)
                    }
                  }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  className="w-full"
                  pt={{
                    input: {
                      root: {
                        style: { minWidth: '40px' },
                      },
                    },
                  }}
                />
                <label htmlFor="on_max">
                  На Максе ({Math.round(sharePercent)}%)
                </label>
              </FloatLabel>
</div>

<div className="flex-1 max-w-[calc(50%-8px)]">
              <FloatLabel className="flex-1">
                <InputNumber
                  inputId="on_sasha"
                  value={onSasha}
                  onValueChange={(e) => {
                    const newOnSasha = e.value ?? null
                    setOnSasha(newOnSasha)

                    if (amount !== null && newOnSasha !== null) {
                      const newOnMax = amount - newOnSasha
                      setOnMax(newOnMax)

                      const ratio = amount === 0 ? 0 : (newOnMax / amount) * 100
                      setSharePercent(ratio)
                    }
                  }}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  className="w-full"
                  pt={{
                    input: {
                      root: {
                        style: { minWidth: '40px' },
                      },
                    },
                  }}
                />
                <label htmlFor="on_sasha">
                  На Саше ({Math.round(100 - sharePercent)}%)
                </label>
              </FloatLabel>
              </div>
            </div>

            <div className="w-full mt-4">
              <Slider
                value={sharePercent}
                onChange={(e) => {
                  const value = (e.value as number) ?? 0
                  setSharePercent(value)

                  if (amount !== null) {
                    const ratio = value / 100
                    const maxPart = amount * ratio
                    const sashaPart = amount - maxPart
                    setOnMax(maxPart)
                    setOnSasha(sashaPart)
                  }
                }}
                min={0}
                max={100}
                className="w-full"
              />
            </div>

            <FloatLabel className="w-full mt-10">
              <InputTextarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                autoResize
                className="w-full"
              />
              <label htmlFor="description">Описание</label>
            </FloatLabel>
          </>
        )}

        <Button
          className="w-full mt-6"
          label="Сохранить"
          severity="success"
          onClick={async () => {
            if (
              !paymentDate ||
              amount === null ||
              onMax === null ||
              onSasha === null ||
              !payer ||
              !trackingStartDate
            ) {
              alert('Заполните сумму, доли и выберите пользователя на главной странице')

              return
            }

            const payload: Omit<Transaction, 'id' | 'created_at'> = {
              payment_date: paymentDate.toISOString(),
              payer,
              amount,
              type: 'purchase',
              on_max: onMax,
              on_sasha: onSasha,
              category: 'unknown',
              tracking_start_date: trackingStartDate,
              description,
            }

            const created = await createTransaction(payload)

            if (created) {
              navigate('/home')
            }
          }}
        />
      </div>
    </div>
  )
}
