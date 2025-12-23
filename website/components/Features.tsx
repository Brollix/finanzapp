"use client";

import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PsychologyIcon from "@mui/icons-material/Psychology";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import SpeedIcon from "@mui/icons-material/Speed";
import LockIcon from "@mui/icons-material/Lock";

interface Feature {
	icon: React.ReactNode;
	title: string;
	description: string;
}

export default function Features() {
	const features: Feature[] = [
		{
			icon: <CameraAltIcon />,
			title: "Escaneo Inteligente",
			description:
				"Captura tickets con la cámara y extrae automáticamente productos, precios y totales usando AWS Textract.",
		},
		{
			icon: <PsychologyIcon />,
			title: "Procesamiento con IA",
			description:
				"Claude 3 (AWS Bedrock) estructura y categoriza los datos de compra de forma inteligente.",
		},
		{
			icon: <DashboardIcon />,
			title: "Dashboard Analítico",
			description:
				"Visualiza gastos, estadísticas y análisis de descuentos por supermercado en tiempo real.",
		},
		{
			icon: <CloudSyncIcon />,
			title: "Sincronización en Tiempo Real",
			description:
				"Base de datos PostgreSQL en Supabase con autenticación integrada y respaldo automático.",
		},
		{
			icon: <SpeedIcon />,
			title: "Arquitectura Escalable",
			description:
				"Backend en Node.js/Express desplegado en AWS con Docker para máxima confiabilidad.",
		},
		{
			icon: <LockIcon />,
			title: "Seguro y Privado",
			description:
				"Tus datos están protegidos con encriptación y autenticación segura.",
		},
	];

	return (
		<section id="features" className="py-20 px-4 bg-background-variant">
			<div className="max-w-7xl mx-auto">
				<h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
					Características <span className="text-primary">Principales</span>
				</h2>
				<p className="text-xl text-text-secondary text-center mb-16 max-w-2xl mx-auto">
					Todo lo que necesitas para gestionar tus finanzas de forma inteligente
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<div
							key={index}
							className="bg-background p-6 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors"
						>
							<div className="mb-4 text-primary flex items-center [&>svg]:text-primary [&>svg]:w-12 [&>svg]:h-12">
								{feature.icon}
							</div>
							<h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
							<p className="text-text-secondary">{feature.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
