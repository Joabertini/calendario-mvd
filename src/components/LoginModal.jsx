import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './LoginModal.module.css'

const VIEWS = { FORM: 'form', SENT: 'sent', ERROR: 'error' }

export default function LoginModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [view, setView]   = useState(VIEWS.FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setLoading(false)

    if (err) {
      setError(err.message)
      setView(VIEWS.ERROR)
    } else {
      setView(VIEWS.SENT)
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <span className={styles.logo}>公園</span>
            <span className={styles.logoName}>Kōen</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {view === VIEWS.FORM && (
          <>
            <h2 className={styles.title}>Entrá a Kōen</h2>
            <p className={styles.sub}>
              Te enviamos un link mágico a tu correo — sin contraseña.
            </p>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <label className={styles.label} htmlFor="koen-email">Correo electrónico</label>
              <input
                id="koen-email"
                type="email"
                className={styles.input}
                placeholder="vos@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
                required
                disabled={loading}
              />
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || !email.trim()}
              >
                {loading ? <span className={styles.spinner} /> : 'Enviame el link'}
              </button>
            </form>
            <p className={styles.legal}>
              Al ingresar aceptás los términos de uso de Kōen.
            </p>
          </>
        )}

        {view === VIEWS.SENT && (
          <div className={styles.sentState}>
            <span className={styles.sentIcon}>✉️</span>
            <h2 className={styles.title}>¡Revisá tu correo!</h2>
            <p className={styles.sub}>
              Te enviamos un link a <strong>{email}</strong>.<br />
              Hacé clic en el link para entrar. El link expira en 1 hora.
            </p>
            <button className={styles.backBtn} onClick={() => setView(VIEWS.FORM)}>
              Usar otro correo
            </button>
          </div>
        )}

        {view === VIEWS.ERROR && (
          <div className={styles.errorState}>
            <span className={styles.errorIcon}>⚠️</span>
            <h2 className={styles.title}>Algo salió mal</h2>
            <p className={styles.errorMsg}>{error}</p>
            <button className={styles.backBtn} onClick={() => { setView(VIEWS.FORM); setError('') }}>
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
