export function DEV_MODE() {
	return process.env.NODE_ENV === "development";
}

export const HARDWARE_PARAMS = {
	stationID: -1,
	motorAngle1: 0,
	motorAngle2: 0,
};