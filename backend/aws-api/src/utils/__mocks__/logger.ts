// Manual mock for logger
const logger = {
	info: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	debug: jest.fn(),
	http: jest.fn(),
};

export default logger;
