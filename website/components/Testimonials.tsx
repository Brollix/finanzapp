export default function Testimonials() {
  // Placeholder para futuros testimonios
  const testimonials = [
    {
      name: 'Próximamente',
      role: 'Usuarios',
      content: 'Los testimonios de nuestros usuarios aparecerán aquí pronto.',
      rating: 5,
    },
  ]

  return (
    <section className="py-20 px-4 bg-background-variant">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Lo que dicen nuestros <span className="text-primary">usuarios</span>
        </h2>
        <p className="text-xl text-text-secondary text-center mb-16 max-w-2xl mx-auto">
          Descubre cómo FinanzApp está ayudando a las personas a gestionar sus finanzas
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background p-6 rounded-xl border border-primary/20"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-primary text-xl">★</span>
                ))}
              </div>
              <p className="text-text-secondary mb-6 italic">"{testimonial.content}"</p>
              <div>
                <div className="font-bold">{testimonial.name}</div>
                <div className="text-text-secondary text-sm">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

