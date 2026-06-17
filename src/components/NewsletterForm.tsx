'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Digite um e-mail válido')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage('E-mail cadastrado com sucesso! 🎉')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Erro ao cadastrar')
      }
    } catch {
      setStatus('error')
      setMessage('Erro de conexão. Tente novamente.')
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu melhor e-mail"
          className="flex-1 px-4 py-3 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white focus:outline-none text-sm"
          disabled={status === 'sending'}
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 shrink-0"
        >
          {status === 'sending' ? 'Enviando...' : 'Quero economizar'}
        </button>
      </form>
      {status !== 'idle' && (
        <p className={`text-sm mt-3 text-center ${status === 'success' ? 'text-green-300' : 'text-red-300'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
