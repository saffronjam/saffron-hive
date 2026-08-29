export function randomVibeSeed(): string {
  const words = new Uint32Array(2);
  crypto.getRandomValues(words);
  const value = (BigInt(words[0] & 0x7fffffff) << 32n) | BigInt(words[1]);
  return (value === 0n ? 1n : value).toString(10);
}
