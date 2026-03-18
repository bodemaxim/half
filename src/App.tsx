import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import { getTransactions } from './api'
import type { Transaction } from './api/types'
import { TransactionsPage } from './pages/transactions-page/transactions-page'
import { Button } from 'primereact/button'

function AppInner() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTransactions()
        setTransactions(data)
      } catch (e) {
        console.error('getTransactions failed:', e)
      }
    }

    void load()
  }, [])

  return (
    <>
      <div>
        <Button
          severity="secondary"
          label="Перейти к транзакциям"
          onClick={() => navigate('/transactions')}
        />
      </div>

      <Routes>
        <Route
          path="/transactions"
          element={<TransactionsPage transactions={transactions} />}
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}

export default App
