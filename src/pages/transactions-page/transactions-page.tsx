import type { TransactionsPageProps } from './transactions-page.types'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { useNavigate } from 'react-router-dom'

export const TransactionsPage = ({ transactions }: TransactionsPageProps) => {
  const navigate = useNavigate()

  return (
    <div>
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
        paginator
        rows={20}
        rowsPerPageOptions={[10, 20, 50, 100]}
        stripedRows
        showGridlines
        scrollable
        scrollHeight="70vh"
        tableStyle={{ minWidth: '64rem' }}
      >
        <Column field="created_at" header="Дата" sortable />
        <Column field="payer" header="Плательщик" sortable />
        <Column field="amount" header="Сумма" sortable />
        <Column field="type" header="Тип" sortable />
        <Column field="on_max" header="На Макса" sortable />
        <Column field="on_sasha" header="На Саше" sortable />
        <Column field="category" header="Категория" sortable />
        <Column field="description" header="Описание" />
        <Column field="tracking_start_date" header="Дата старта" sortable />
        <Column field="id" header="ID" />
      </DataTable>
    </div>
  )
}

