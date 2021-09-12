export const curve = function (amount: number, currentSupply: number, startPrice: number): number {
  const divider = currentSupply.toString().length;
  function pfq(x: number) {
    return (Math.pow(x / currentSupply, 31) * x + x);
  }

  // 1= 7, 10 = 8, 100 = 9, 1000 = 10, 10000 = 11
  return (pfq(currentSupply + amount) - pfq(currentSupply)) / Math.pow(10, divider + 6) + startPrice;
}
