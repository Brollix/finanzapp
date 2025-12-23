'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      question: '¿Cómo funciona el escaneo de tickets?',
      answer: 'Simplemente abre la app, apunta la cámara a tu ticket y captura la foto. Nuestra IA utiliza AWS Textract para extraer el texto y luego Claude 3 para estructurar los datos automáticamente.',
    },
    {
      question: '¿Es seguro guardar mis datos financieros?',
      answer: 'Sí, todos tus datos están encriptados y almacenados de forma segura en Supabase. Utilizamos autenticación robusta y nunca compartimos tu información con terceros.',
    },
    {
      question: '¿Funciona con todos los supermercados?',
      answer: 'FinanzApp funciona con la mayoría de los tickets de supermercados y comercios. La IA está entrenada para reconocer diferentes formatos de tickets argentinos.',
    },
    {
      question: '¿Necesito conexión a internet?',
      answer: 'Sí, necesitas conexión a internet para escanear y procesar tickets, ya que utilizamos servicios de AWS en la nube. Sin embargo, puedes ver tus datos guardados sin conexión.',
    },
    {
      question: '¿Cuánto cuesta usar FinanzApp?',
      answer: 'FinanzApp es gratuita para uso personal. Puedes escanear y gestionar todos tus tickets sin costo alguno.',
    },
    {
      question: '¿Puedo exportar mis datos?',
      answer: 'Sí, puedes exportar tus datos en cualquier momento desde la sección de configuración de la app.',
    },
  ]

  return (
    <section id="faq" className="py-20 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Preguntas <span className="text-primary">Frecuentes</span>
        </h2>
        <p className="text-xl text-text-secondary text-center mb-16 max-w-2xl mx-auto">
          Resolvemos tus dudas sobre FinanzApp
        </p>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-background-variant rounded-xl border border-primary/20 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-background/50 transition-colors"
              >
                <span className="font-bold text-lg">{faq.question}</span>
                <span className="text-primary text-2xl">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 border-t border-primary/20">
                  <p className="text-text-secondary">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

