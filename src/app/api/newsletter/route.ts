import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    // Salvar no banco (upsert: se já existe, ignora sem erro)
    await prisma.newsletterEmail.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {},
      create: { email: email.toLowerCase().trim() },
    })

    return NextResponse.json({ success: true, message: 'E-mail cadastrado com sucesso!' })
  } catch (error) {
    console.error('Newsletter error:', error)
    return NextResponse.json({ error: 'Erro ao cadastrar e-mail' }, { status: 500 })
  }
}
