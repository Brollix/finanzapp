import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode,
} from "react";
import { Alert, AlertButton, AlertType } from "@/components/ui/Alert";

interface AlertContextType {
	showAlert: (
		title?: string,
		message?: string,
		buttons?: AlertButton[],
		type?: AlertType
	) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
	const [visible, setVisible] = useState(false);
	const [title, setTitle] = useState<string | undefined>();
	const [message, setMessage] = useState<string | undefined>();
	const [buttons, setButtons] = useState<AlertButton[]>([{ text: "OK" }]);
	const [type, setType] = useState<AlertType>("default");

	const showAlert = useCallback(
		(
			alertTitle?: string,
			alertMessage?: string,
			alertButtons?: AlertButton[],
			alertType?: AlertType
		) => {
			setTitle(alertTitle);
			setMessage(alertMessage);
			setButtons(alertButtons || [{ text: "OK" }]);
			setType(alertType || "default");
			setVisible(true);
		},
		[]
	);

	const handleDismiss = useCallback(() => {
		setVisible(false);
	}, []);

	return (
		<AlertContext.Provider value={{ showAlert }}>
			{children}
			<Alert
				visible={visible}
				title={title}
				message={message}
				buttons={buttons}
				type={type}
				onDismiss={handleDismiss}
			/>
		</AlertContext.Provider>
	);
};

export const useAlert = (): AlertContextType => {
	const context = useContext(AlertContext);
	if (!context) {
		throw new Error("useAlert must be used within an AlertProvider");
	}
	return context;
};

