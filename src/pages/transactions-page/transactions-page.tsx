import type { TransactionsPageProps } from './transactions-page.types'
import type { Transaction } from '../../api/types'
import { enumConfig } from '../../api/consts'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'

const categoryLabelByValue = new Map<string, string>(
  enumConfig.categories.map((c) => [c.value, c.label]),
)
const userLabelByValue = new Map<string, string>(
  enumConfig.users.map((u) => [u.value, u.label]),
)
const transactionTypeLabelByValue = new Map<string, string>(
  enumConfig.transactionTypes.map((t) => [t.value, t.label]),
)

function categoryLabel(category: string): string {
  return categoryLabelByValue.get(category) ?? category
}

function userLabel(payer: string): string {
  return userLabelByValue.get(payer) ?? payer
}

function transactionTypeLabel(type: string): string {
  return transactionTypeLabelByValue.get(type) ?? type
}

export const TransactionsPage = ({
  transactions,
  onDeleteTransaction,
}: TransactionsPageProps) => {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)
  const [selected, setSelected] = useState<Transaction | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')

    // Принимаем либо событие, либо сам объект mq для инициализации
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(!e.matches)
    }

    // Устанавливаем начальное значение при монтировании
    update(mq)

    // Современный способ подписки
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    } 
    // Поддержка старых браузеров (Safari < 14)
    else {
      mq.addListener(update)
      return () => mq.removeListener(update)
    }
  }, [])

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return ''
    try {
      const zonedDateTime = Temporal.Instant.from(value).toZonedDateTimeISO(
        'Europe/Moscow',
      )
      const day = String(zonedDateTime.day).padStart(2, '0')
      const month = String(zonedDateTime.month).padStart(2, '0')
      const year = String(zonedDateTime.year)
      const hour = String(zonedDateTime.hour).padStart(2, '0')
      const minute = String(zonedDateTime.minute).padStart(2, '0')
      return `${day}.${month}.${year} ${hour}:${minute}`
    } catch {
      return value
    }
  }

  const renderMobileData = (t: (typeof transactions)[number]) => (
    <ul className="m-0 p-0 list-none text-sm space-y-1">
      <li><strong>Плательщик:</strong> {userLabel(t.payer)}</li>
      <li><strong>Тип:</strong> {transactionTypeLabel(t.type)}</li>
      <li><strong>Сумма:</strong> {t.amount}</li>
      <li><strong>На Максе:</strong> {t.on_max}</li>
      <li><strong>На Саше:</strong> {t.on_sasha}</li>
      <li><strong>Категория:</strong> {categoryLabel(t.category)}</li>
      <li><strong>Описание:</strong> {t.description}</li>
      <li><strong>Дата старта:</strong> {formatDateTime(t.tracking_start_date)}</li>
    </ul>
  )

  return (
    <div className="h-dvh p-5">
      <div className="flex-b">
        <h1 className="text-3xl font-bold m-0">Транзакции</h1>
        <div className="flex items-center gap-1">
          <Button
            icon="pi pi-plus"
            rounded
            text
            aria-label="Новая транзакция"
            onClick={() => navigate('/new')}
          />
          <Button
            icon="pi pi-pencil"
            rounded
            text
            disabled={!selected}
            aria-label="Редактировать"
            onClick={() => selected && navigate(`/edit/${selected.id}`)}
          />
          <Button
            icon="pi pi-trash"
            rounded
            text
            severity="danger"
            disabled={!selected}
            aria-label="Удалить"
            onClick={async () => {
              if (!selected) return
              if (
                !confirm(
                  'Удалить выбранную транзакцию? Это действие нельзя отменить.',
                )
              ) {
                return
              }
              const id = selected.id
              const ok = await Promise.resolve(onDeleteTransaction(id))
              if (ok) setSelected(null)
            }}
          />
          <div className="ml-5">
            <Button
              icon="pi pi-backward"
              rounded
              text
              aria-label="На главную"

              onClick={() => navigate('/home')}
            />
          </div>
        </div>
      </div>

      <DataTable
        key={isMobile ? 'mobile' : 'desktop'}
        value={transactions}
        dataKey="id"
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value as Transaction | null)}
        metaKeySelection={false}
        rowClassName={(rowData: Transaction) =>
          String(rowData.type).toLowerCase() === 'transfer' ? '!bg-green-300' : ''
        }
        stripedRows
        showGridlines
        scrollable={isMobile}
        scrollHeight="calc(100vh - 80px)"
        tableStyle={isMobile ? undefined : { minWidth: '64rem' }}
      >
        <Column
          field="payment_date"
          header="Дата"
          sortable
          body={(rowData) => formatDateTime(rowData.payment_date)}
        />

        {isMobile && <Column header="Данные" body={renderMobileData} />}
        
        {!isMobile && (
          <Column
            field="payer"
            header="Плательщик"
            sortable
            body={(rowData) => userLabel(rowData.payer)}
          />
        )}
        {!isMobile && (
          <Column
            field="type"
            header="Тип"
            sortable
            body={(rowData) => transactionTypeLabel(rowData.type)}
          />
        )}
        {!isMobile && <Column field="amount" header="Сумма" sortable />}
        {!isMobile && <Column field="on_max" header="На Максе" sortable />}
        {!isMobile && <Column field="on_sasha" header="На Саше" sortable />}
        {!isMobile && (
          <Column
            field="category"
            header="Категория"
            sortable
            body={(rowData) => categoryLabel(rowData.category)}
          />
        )}
        {!isMobile && <Column field="description" header="Описание" />}
        {!isMobile && (
          <Column
            field="tracking_start_date"
            header="Дата старта"
            sortable
            body={(rowData) => formatDateTime(rowData.tracking_start_date)}
          />
        )}
      </DataTable>
    </div>
  )
}