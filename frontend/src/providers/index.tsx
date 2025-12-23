import React from "react";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { OcrProvider } from "@/context/OcrContext";
import { AlertProvider } from "@/context/AlertContext";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<OcrProvider>
				<AlertProvider>{children}</AlertProvider>
			</OcrProvider>
		</AuthProvider>
	);
}
