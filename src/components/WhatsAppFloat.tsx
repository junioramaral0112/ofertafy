'use client'

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/KiKjuB0AiMX0P5sVBteJpz?s=cl&p=a&mlu=4&amv=1'

export default function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 left-5 z-50 flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-200"
      title="Entrar no grupo de ofertas do WhatsApp"
    >
      <img src="/whatsapp.png" alt="WhatsApp" className="w-7 h-7" />
    </a>
  )
}
