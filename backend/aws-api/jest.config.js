/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	testMatch: ["**/*.test.ts"],
	verbose: true,
	forceExit: true,
	clearMocks: true,
	resetMocks: true,
	restoreMocks: true,
	extensionsToTreatAsEsm: [".ts"],
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: true,
				isolatedModules: true,
			},
		],
	},
};
