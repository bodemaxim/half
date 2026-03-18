import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'

export const HomePage = () => {
  const navigate = useNavigate()

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold my-5">Главная страница</h1>
      <Button
        severity="secondary"
        label="Перейти к транзакциям"
        onClick={() => navigate('/transactions')}
        className="mt-2"
      />
    </div>
  )
}

