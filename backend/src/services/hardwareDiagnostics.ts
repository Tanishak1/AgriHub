export interface HardwareDiagnostics {
  rawPacket: string | null;
  parsedPacket: unknown;
  validatedSensorData: unknown;
  lastPacketTime: string | null;
}

const latest = new Map<string, HardwareDiagnostics>();

export const updateHardwareDiagnostics = (deviceId: string, data: Partial<HardwareDiagnostics>) => {
  latest.set(deviceId, { rawPacket: null, parsedPacket: null, validatedSensorData: [], lastPacketTime: null, ...latest.get(deviceId), ...data });
};

export const getHardwareDiagnostics = (deviceId: string) => latest.get(deviceId) || {
  rawPacket: null,
  parsedPacket: null,
  validatedSensorData: [],
  lastPacketTime: null,
};