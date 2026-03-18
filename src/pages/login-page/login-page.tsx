import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InputText } from 'primereact/inputtext'
import { FloatLabel } from 'primereact/floatlabel'
import { Button } from 'primereact/button'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')

  const rightPassword = 'admin' // TODO: заменить на реальную авторизацию позже

  useEffect(() => {
    const storedPassword = localStorage.getItem('half_password')
    if (storedPassword && storedPassword === rightPassword) {
      navigate('/home')
    }
  }, [navigate])

  const enterApp = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === rightPassword) {
      localStorage.setItem('half_password', password)
      navigate('/home')
      return
    }

    alert('Неверный пароль')
  }

  return (
    <div className="full-size p-5">

        <h1 className="text-3xl font-bold my-5 text-center">Войти</h1>
<div className="w-full md:w-1/2 mx-auto">
        <FloatLabel>
          <InputText
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
          />
          <label htmlFor="password">Пароль</label>
        </FloatLabel>
</div>
        <div className="flex justify-center my-5 w-full md:w-1/2 mx-auto">
        <Button type="submit" label="Войти" className="mt-2 w-full" onClick={enterApp} />
        </div>

    </div>
  )
}

