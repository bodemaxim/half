import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import './App.css'
import { deleteTransaction, getTransactions } from './api'
import type { Transaction } from './api/types'
import { TransactionsPage } from './pages/transactions-page/transactions-page'
import { HomePage } from './pages/home-page/home-page'
import { LoginPage } from './pages/login-page/login-page'
import { EditPage } from './pages/edit-page/edit-page'
import { AnalyticsPage } from './pages/analytics-page/analytics-page'

function getNewestTrackingStartDate(
  transactions: Transaction[],
): Transaction['tracking_start_date'] | undefined {
  let newest: string | undefined
  let newestMs = -Infinity

  for (const t of transactions) {
    if (typeof t.tracking_start_date !== 'string') continue
    const ms = new Date(t.tracking_start_date).getTime()
    if (Number.isNaN(ms)) continue
    if (ms > newestMs) {
      newestMs = ms
      newest = t.tracking_start_date
    }
  }

  return newest
}

function EditTransactionPage({
  transactions,
  setTransactions,
}: {
  transactions: Transaction[]
  setTransactions: Dispatch<SetStateAction<Transaction[]>>
}) {
  const { id } = useParams<{ id: string }>()
  const transaction = transactions.find((t) => t.id === id)
  if (!transaction) {
    return <Navigate to="/transactions" replace />
  }

  return (
    <EditPage
      mode="edit"
      transaction={transaction}
      payer={transaction.payer}
      trackingStartDate={transaction.tracking_start_date}
      onTransactionUpdated={(updated) => {
        setTransactions((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t)),
        )
      }}
    />
  )
}

function ClosePeriodPage({
  payer,
  transactions,
  onTransactionCreated,
}: {
  payer: Transaction['payer'] | null
  transactions: Transaction[]
  onTransactionCreated?: (t: Transaction) => void
}) {
  const location = useLocation()
  const state = location.state as
    | { amount?: number; trackingStartDate?: string | null }
    | null
    | undefined

  const trackingStartDate =
    state?.trackingStartDate ??
    (typeof transactions[0]?.tracking_start_date === 'string'
      ? transactions[0].tracking_start_date
      : undefined)

  return (
    <EditPage
      mode="close_period"
      payer={payer}
      trackingStartDate={trackingStartDate}
      defaultAmount={state?.amount}
      onTransactionCreated={onTransactionCreated}
    />
  )
}

function AppInner() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payer, setPayer] = useState<Transaction['payer'] | null>(null)
  const selectedUserStorageKey = 'half_selected_user'
  const homeAndTransactionsLimit = 150

  const reloadTransactions = async () => {
    try {
      const data = await getTransactions({ limit: homeAndTransactionsLimit })
      setTransactions(data)
    } catch (e) {
      console.error('getTransactions failed:', e)
    }
  }

  useEffect(() => {
    const load = async () => {
      await reloadTransactions()
    }

    void load()
  }, [])

  useEffect(() => {
    const savedUser = localStorage.getItem(selectedUserStorageKey)
    if (savedUser === 'max' || savedUser === 'sasha') {
      setPayer(savedUser)
    }
  }, [])

  const handleDeleteTransaction = async (id: Transaction['id']) => {
    const ok = await deleteTransaction(id)
    if (ok) {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    }
    return ok
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/home"
          element={<HomePage payer={payer} setPayer={setPayer} transactions={transactions} />}
        />
        <Route
          path="/new"
          element={
            <EditPage
              mode="new"
              payer={payer}
              trackingStartDate={getNewestTrackingStartDate(transactions)}
              onTransactionCreated={() => {
                void reloadTransactions()
              }}
            />
          }
        />
        <Route
          path="/close-period"
          element={
            <ClosePeriodPage
              payer={payer}
              transactions={transactions}
              onTransactionCreated={() => {
                void reloadTransactions()
              }}
            />
          }
        />
        <Route
          path="/transactions"
          element={
            <TransactionsPage
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
            />
          }
        />
        <Route path="/analytics" element={<AnalyticsPage payer={payer} />} />
        <Route
          path="/edit/:id"
          element={
            <EditTransactionPage
              transactions={transactions}
              setTransactions={setTransactions}
            />
          }
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter basename="/half">
      <AppInner />
    </BrowserRouter>
  )
}

export default App
