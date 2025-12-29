/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	testMatch: ["**/*.test.ts", "!**/integration/**"],
	setupFiles: ["<rootDir>/tests/setup.ts"],
	verbose: true,
	clearMocks: true,
	resetMocks: true,
	restoreMocks: true,
	extensionsToTreatAsEsm: [".ts"],
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: true,
			},
		],
	},
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/*.d.ts",
		"!src/index.ts",
		"!src/**/*.test.ts",
		"!src/scripts/**/*",
	],
	coverageThreshold: {
		global: {
			branches: 4,
			functions: 5,
			lines: 17,
			statements: 17,
		},
	},
	detectOpenHandles: false,
	testTimeout: 10000,
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
};
