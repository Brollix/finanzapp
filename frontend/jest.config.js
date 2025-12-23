module.exports = {
	preset: "jest-expo",
	transformIgnorePatterns: [
		"node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
	],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	collectCoverageFrom: [
		"src/**/*.{ts,tsx}",
		"!src/**/*.d.ts",
		"!src/**/*.styles.ts",
		"!src/types/**",
		"!src/assets/**",
	],
	coverageThreshold: {
		global: {
			statements: 50,
			branches: 40,
			functions: 50,
			lines: 50,
		},
	},
	testMatch: [
		"**/__tests__/**/*.test.(ts|tsx)",
		"**/?(*.)+(spec|test).(ts|tsx)",
	],
};

