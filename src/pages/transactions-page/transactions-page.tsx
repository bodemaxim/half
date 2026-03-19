import type { TransactionsPageProps } from './transactions-page.types'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'

export const TransactionsPage = ({ transactions }: TransactionsPageProps) => {
  const navigate = useNavigate()
  const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
      return ''
    }

    const zonedDateTime = Temporal.Instant.from(value).toZonedDateTimeISO('UTC')
    const day = String(zonedDateTime.day).padStart(2, '0')
    const month = String(zonedDateTime.month).padStart(2, '0')
    const year = String(zonedDateTime.year)
    const hour = String(zonedDateTime.hour).padStart(2, '0')
    const minute = String(zonedDateTime.minute).padStart(2, '0')

    return `${day}.${month}.${year} ${hour}:${minute}`
  }

  return (
    <div className="p-5">
      <div className="flex-b">
      <h1 className="text-3xl font-bold my-5">Транзакции</h1>
        <Button
          icon="pi pi-backward"
          rounded
          text
          aria-label="На главную"
          onClick={() => navigate('/')}
        />
      </div>

      <DataTable
        value={transactions}
        stripedRows
        showGridlines
        scrollable
        scrollHeight="70vh"
        tableStyle={{ minWidth: '64rem' }}
      >
        <Column
          field="payment_date"
          header="Дата"
          sortable
          body={(rowData) => formatDateTime(rowData.payment_date)}
        />
        <Column field="payer" header="Плательщик" sortable />
        <Column field="type" header="Тип" sortable />
        <Column field="amount" header="Сумма" sortable />
        <Column field="on_max" header="На Максе" sortable />
        <Column field="on_sasha" header="На Саше" sortable />
        <Column field="category" header="Категория" sortable />
        <Column field="description" header="Описание" />
        <Column
          field="tracking_start_date"
          header="Дата старта"
          sortable
          body={(rowData) => formatDateTime(rowData.tracking_start_date)}
        />
      </DataTable>
    </div>
  )
}

