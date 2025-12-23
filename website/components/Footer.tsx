export default function Footer() {
  return (
    <footer className="bg-background-variant border-t border-primary/20 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">FinanzApp</h3>
            <p className="text-text-secondary">
              Automatiza el registro de tus gastos con IA y OCR.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Producto</h4>
            <ul className="space-y-2 text-text-secondary">
              <li><a href="#features" className="hover:text-primary transition-colors">Características</a></li>
              <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Descargar</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Desarrolladores</h4>
            <ul className="space-y-2 text-text-secondary">
              <li><a href="/api/docs" className="hover:text-primary transition-colors">API Docs</a></li>
              <li><a href="https://github.com" className="hover:text-primary transition-colors">GitHub</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-text-secondary">
              <li><a href="/privacy" className="hover:text-primary transition-colors">Privacidad</a></li>
              <li><a href="/terms" className="hover:text-primary transition-colors">Términos</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary/20 pt-8 text-center text-text-secondary">
          <p>&copy; {new Date().getFullYear()} FinanzApp. Todos los derechos reservados.</p>
          <p className="mt-2">Desarrollado por Agustín Brollo</p>
        </div>
      </div>
    </footer>
  )
}


