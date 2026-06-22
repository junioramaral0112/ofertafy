'use client'

/**
 * 💬 Botão flutuante do WhatsApp — fixo no canto inferior esquerdo
 * Visível mesmo durante rolagem da página.
 */

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz?s=cl&p=a&mlu=4&amv=1'

export default function WhatsAppFloat() {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3">
      {/* Label */}
      <span className="hidden sm:inline-block bg-white text-slate-700 text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg border border-slate-100">
        entre no nosso grupo de ofertas →
      </span>

      {/* Botão verde com ícone oficial */}
      <a
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-200 animate-pulse-soft"
        title="Entrar no grupo de ofertas do WhatsApp"
      >
        <img src="/whatsapp.png" alt="WhatsApp" className="w-7 h-7" />
      </a>
    </div>
  )
}
