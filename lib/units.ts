// lib/units.ts
// Unit helpers. The database keeps imperial values (lbs / in), so we convert
// when showing them and convert back when saving. Switching units never changes stored data.

export type UnitSystem = 'metric' | 'imperial';

const LBS_PER_KG = 2.20462262;
const CM_PER_IN = 2.54;

export const kgToLbs = (kg: number) => kg * LBS_PER_KG;
export const lbsToKg = (lbs: number) => lbs / LBS_PER_KG;
export const cmToIn = (cm: number) => cm / CM_PER_IN;
export const inToCm = (inch: number) => inch * CM_PER_IN;

/** 1 decimal for display: 3.40 -> 3.4 */
export const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Stored lbs -> number to display in the chosen unit */
export const weightFromLbs = (lbs: number, unit: UnitSystem) =>
  round1(unit === 'metric' ? lbsToKg(lbs) : lbs);

/** Stored inches -> number to display in the chosen unit */
export const lengthFromIn = (inch: number, unit: UnitSystem) =>
  round1(unit === 'metric' ? inToCm(inch) : inch);

/** Number typed by the user -> lbs to save */
export const weightToLbs = (value: number, unit: UnitSystem) =>
  round2(unit === 'metric' ? kgToLbs(value) : value);

/** Number typed by the user -> inches to save */
export const lengthToIn = (value: number, unit: UnitSystem) =>
  round2(unit === 'metric' ? cmToIn(value) : value);

export const weightUnitLabel = (unit: UnitSystem) => (unit === 'metric' ? 'kg' : 'lbs');
export const lengthUnitLabel = (unit: UnitSystem) => (unit === 'metric' ? 'cm' : 'in');