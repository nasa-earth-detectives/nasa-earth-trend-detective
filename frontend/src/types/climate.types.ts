export type ClimateVariable = 'Gistemp' | 'ModisNdvi' | 'GraceMass' | 'Oco2';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  resolutionDegrees?: number;
}

export interface ClimateObservation {
  id: string;
  variable: ClimateVariable;
  latitude: number;
  longitude: number;
  value: number;
  unit: string;
  anomaly?: number;
  timestamp: string;
}

export interface VariableMetadata {
  id: ClimateVariable;
  name: string;
  satelliteMission: string;
  unit: string;
  description: string;
  colorScheme: string;
}
