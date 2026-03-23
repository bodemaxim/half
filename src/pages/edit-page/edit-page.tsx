import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { InputNumber } from 'primereact/inputnumber'
import { FloatLabel } from 'primereact/floatlabel'
import { InputTextarea } from 'primereact/inputtextarea'
import { Slider } from 'primereact/slider'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { createTransaction, updateTransaction } from '../../api'
import type { Transaction } from '../../api/types'

type EditPageProps = {
  mode: 'new' | 'edit' | 'close_period'
  payer?: Transaction['payer'] | null
  trackingStartDate?: Transaction['tracking_start_date']
  /** Предзаполнение суммы (режим «Закрыть период») */
  defaultAmount?: number
  /** Редактируемая запись (режим edit) */
  transaction?: Transaction
  onTransactionUpdated?: (t: Transaction) => void
}

export const EditPage = ({
  mode,
  payer,
  trackingStartDate,
  defaultAmount,
  transaction,
  onTransactionUpdated,
}: EditPageProps) => {
  const navigate = useNavigate()
  const [paymentDate, setPaymentDate] = useState<Date | null>(
    new Date(Temporal.Now.instant().epochMilliseconds),
  )
  const [amount, setAmount] = useState<number | null>(() =>
    mode === 'close_period' && defaultAmount !== undefined ? defaultAmount : null,
  )
  const [description, setDescription] = useState<string>(() =>
    mode === 'close_period'
      ? 'Это последняя транзакция текущего периода, перевод!'
      : '',
  )
  const [onMax, setOnMax] = useState<number | null>(null)
  const [onSasha, setOnSasha] = useState<number | null>(null)
  const [sharePercent, setSharePercent] = useState<number>(50)

  useEffect(() => {
    if (mode !== 'edit' || !transaction) return
    setPaymentDate(new Date(transaction.payment_date))
    setAmount(transaction.amount)
    setDescription(transaction.description)
    setOnMax(transaction.on_max)
    setOnSasha(transaction.on_sasha)
    const sp =
      transaction.amount === 0
        ? 0
        : (transaction.on_max / transaction.amount) * 100
    setSharePercent(sp)
  }, [mode, transaction])

  useEffect(() => {
    if (mode === 'edit' && amount === null) return

    if (mode === 'close_period') {
      if (amount === null || !payer) {
        setOnMax(null)
        setOnSasha(null)

        return
      }

      if (payer === 'sasha') {
        setOnMax(0)
        setOnSasha(amount)
      } else {
        setOnMax(amount)
        setOnSasha(0)
      }

      return
    }

    if (amount === null) {
      setOnMax(null)
      setOnSasha(null)

      return
    }

    const ratio = sharePercent / 100
    const maxPart = amount * ratio
    const sashaPart = amount - maxPart
    setOnMax(maxPart)
    setOnSasha(sashaPart)
  }, [mode, amount, sharePercent, payer])

  return (
    <div className="p-5">
      <div className="flex-b">
        <h1 className="text-3xl font-bold my-5">
          {mode === 'close_period'
            ? 'Закрыть период'
            : mode === 'new'
              ? 'Новая транзакция'
              : 'Редактирование транзакции'}
        </h1>
        <Button
          icon="pi pi-backward"
          rounded
          text
          aria-label="Назад"
          onClick={() =>
            navigate(mode === 'edit' ? '/transactions' : '/home')
          }
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
            onChange={(e) => setAmount(e.value ?? null)}
            mode="decimal"
            minFractionDigits={0}
            maxFractionDigits={0}
            className="w-full"
          />
          <label htmlFor="amount">Сумма</label>
        </FloatLabel>

        {mode !== 'close_period' && (
          <>
            <div className="w-full flex-b mt-10 gap-4">
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
          </>
        )}

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

        <Button
          className="w-full mt-6"
          label="Сохранить"
          severity="success"
          onClick={async () => {
            if (mode === 'edit' && transaction) {
              if (!paymentDate || amount === null) {
                alert('Заполните дату и сумму')

                return
              }
              if (onMax === null || onSasha === null) {
                alert('Заполните доли')

                return
              }

              const updated = await updateTransaction(transaction.id, {
                payment_date: paymentDate.toISOString(),
                payer: transaction.payer,
                amount,
                type: transaction.type,
                on_max: onMax,
                on_sasha: onSasha,
                category: transaction.category,
                tracking_start_date: transaction.tracking_start_date,
                description,
              })

              if (updated) {
                onTransactionUpdated?.(updated)
                navigate('/transactions')
              }

              return
            }

            if (!paymentDate || amount === null || !payer) {
              alert(
                'Заполните сумму и выберите пользователя на главной странице',
              )

              return
            }

            if (mode !== 'close_period') {
              if (
                onMax === null ||
                onSasha === null ||
                !trackingStartDate
              ) {
                alert(
                  'Заполните сумму, доли и выберите пользователя на главной странице',
                )

                return
              }
            }

            const resolvedOnMax =
              mode === 'close_period'
                ? payer === 'max'
                  ? amount
                  : 0
                : onMax!
            const resolvedOnSasha =
              mode === 'close_period'
                ? payer === 'sasha'
                  ? amount
                  : 0
                : onSasha!

            const resolvedTrackingStart =
              mode === 'close_period'
                ? new Date(paymentDate.getTime() + 1000).toISOString()
                : trackingStartDate!

            const payload: Omit<Transaction, 'id' | 'created_at'> = {
              payment_date: paymentDate.toISOString(),
              payer,
              amount,
              type: mode === 'close_period' ? 'transfer' : 'purchase',
              on_max: resolvedOnMax,
              on_sasha: resolvedOnSasha,
              category: 'unknown',
              tracking_start_date: resolvedTrackingStart,
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
