function HowItWorks() {
	const steps = [
		{
			number: "1",
			title: "Escanea",
			description:
				"Abre la app y captura una foto de tu ticket de compra con la cámara.",
		},
		{
			number: "2",
			title: "Procesa",
			description:
				"Nuestra IA extrae automáticamente productos, precios y descuentos usando OCR y procesamiento inteligente.",
		},
		{
			number: "3",
			title: "Analiza",
			description:
				"Visualiza tus gastos, estadísticas y análisis de descuentos en el dashboard interactivo.",
		},
	];

	return (
		<section className="py-20 px-4 bg-background">
			<div className="max-w-7xl mx-auto">
				<h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
					¿Cómo <span className="text-primary">Funciona</span>?
				</h2>
				<p className="text-xl text-text-secondary text-center mb-16 max-w-2xl mx-auto">
					En solo 3 pasos simples, gestiona todos tus gastos automáticamente
				</p>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
					{steps.map((step, index) => (
						<div key={index} className="relative">
							<div className="bg-background-variant p-8 rounded-xl border border-primary/20 text-center relative z-10">
								<div className="text-6xl font-bold text-primary mb-4">
									{step.number}
								</div>
								<h3 className="text-2xl font-bold mb-4">{step.title}</h3>
								<p className="text-text-secondary">{step.description}</p>
							</div>
							{index < steps.length - 1 && (
								<div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-primary/30 transform -translate-y-1/2 z-0">
									<div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-0 h-0 border-l-8 border-l-primary/30 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default HowItWorks;

