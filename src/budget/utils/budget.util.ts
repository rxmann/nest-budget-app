// main unit → paisa/cents
export function toStorageAmount(amount: number): bigint {
  return BigInt(Math.round(amount * 100));
}

// paisa/cents → main unit
export function toDisplayAmount(amount: bigint): number {
  return Number(amount) / 100;
}