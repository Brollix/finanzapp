export type RootStackParamList = {
	"(auth)/login": { signedOut?: boolean };
	"(tabs)": undefined;
	// Agregar más rutas según sea necesario
};

declare global {
	namespace ReactNavigation {
		interface RootParamList extends RootStackParamList {}
	}
}
