import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { FloatLabel } from 'primereact/floatlabel'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { createEnvelope, getEnvelope, updateEnvelope } from '../../api'
import {
  type EnvelopeLocationState,
  readSelectedSavingsUser,
} from './savings-utils'

type EnvelopeFormPageProps = {
  mode: 'new' | 'edit'
}

export const EnvelopeFormPage = ({ mode }: EnvelopeFormPageProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as EnvelopeLocationState | null) ?? null
  const envelopeId = state?.envelopeId
  const fromView = state?.fromView === true

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode !== 'edit' || !envelopeId) return

    let cancelled = false

    const load = async () => {
      const envelope = await getEnvelope(envelopeId)

      if (cancelled) return

      if (!envelope) {
        navigate('/savings', { replace: true })

        return
      }

      setName(envelope.name)
      setDescription(envelope.description ?? '')
      setIsActive(envelope.is_active)
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [mode, envelopeId, navigate])

  if (mode === 'edit' && !envelopeId) {
    return <Navigate to="/savings" replace />
  }

  const goBack = () => {
    if (mode === 'edit' && fromView && envelopeId) {
      navigate('/savings/view', { state: { envelopeId } })

      return
    }

    navigate('/savings')
  }

  const handleSave = async () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      alert('Введите название конверта')

      return
    }

    const user = readSelectedSavingsUser()

    if (!user) {
      alert('Сначала выберите пользователя на главной')

      return
    }

    setSaving(true)

    try {
      if (mode === 'new') {
        const created = await createEnvelope({
          name: trimmedName,
          description: description.trim() || null,
          is_active: true,
          user,
        })

        if (!created) return

        navigate('/savings/view', { state: { envelopeId: created.id } })

        return
      }

      if (!envelopeId) return

      const updated = await updateEnvelope(envelopeId, {
        name: trimmedName,
        description: description.trim() || null,
        is_active: isActive,
      })

      if (!updated) return

      navigate('/savings/view', { state: { envelopeId: updated.id } })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-dvh p-5 overflow-y-auto">
      <div className="w-full md:w-1/2 mx-auto">
        <div className="flex-b">
          <h1 className="text-3xl font-bold m-0 mb-4">
            {mode === 'new' ? 'Новый конверт' : 'Редактировать конверт'}
          </h1>
          <Button
            icon="pi pi-backward"
            rounded
            text
            aria-label="Назад"
            className="transform translate-x-[16px]"
            onClick={goBack}
          />
        </div>

        {loading ? (
          <div className="text-sm text-surface-600">Загрузка…</div>
        ) : (
          <div className="mt-6 space-y-8">
            <FloatLabel className="w-full">
              <InputText
                id="envelope-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
              <label htmlFor="envelope-name">Название</label>
            </FloatLabel>

            <FloatLabel className="w-full">
              <InputTextarea
                id="envelope-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full"
                autoResize
              />
              <label htmlFor="envelope-description">Описание</label>
            </FloatLabel>

            {mode === 'edit' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  inputId="envelope-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(Boolean(e.checked))}
                />
                <label htmlFor="envelope-active" className="cursor-pointer">
                  Активен
                </label>
              </div>
            )}

            <Button
              severity="success"
              label="Сохранить"
              className="w-full"
              loading={saving}
              onClick={() => {
                void handleSave()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
