import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-b from-background to-background-variant">
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-30 h-30 flex items-center justify-center">
            <Image
              src="/logo_finanzapp.png"
              alt="FinanzApp Logo"
              width={120}
              height={120}
              className="rounded-2xl"
              priority
              unoptimized
            />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
          Automatiza el registro de{' '}
          <span className="text-primary">tus gastos</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto text-balance">
          Escanea tus tickets con la cámara y deja que la IA extraiga automáticamente 
          productos, precios y descuentos. Gestiona tus finanzas sin esfuerzo.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#"
            className="px-8 py-4 bg-primary text-background font-bold rounded-lg hover:bg-primary-dark transition-colors text-lg"
          >
            Descargar App
          </a>
          <a
            href="#features"
            className="px-8 py-4 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-background transition-colors text-lg"
          >
            Conocer más
          </a>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">100%</div>
            <div className="text-text-secondary">Automático</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">IA</div>
            <div className="text-text-secondary">Powered</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">0</div>
            <div className="text-text-secondary">Esfuerzo</div>
          </div>
        </div>
      </div>
    </section>
  )
}

