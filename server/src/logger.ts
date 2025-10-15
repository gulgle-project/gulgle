import winston from "winston";

export const logger = winston.createLogger({
	level: "debug",
	format: winston.format.prettyPrint(),
	transports: [
		new winston.transports.Console({
			format: winston.format.printf(
				(info) => `${new Date()} [${info.level}] ${info.message}`,
			),
		}),
	],
});
