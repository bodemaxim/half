import type { TransactionsPageProps } from './transactions-page.types'

export const TransactionsPage = ({ transactions }: TransactionsPageProps) => {
  return (
    <div>
      <h1>Transactions</h1>
      <pre>{JSON.stringify(transactions, null, 2)}</pre>
    </div>
  )
}

