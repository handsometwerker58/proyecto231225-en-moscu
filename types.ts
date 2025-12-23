
export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface OrnamentData {
  id: number;
  chaosPosition: [number, number, number];
  targetPosition: [number, number, number];
  type: 'box' | 'ball' | 'light';
  color: string;
  weight: number;
}
