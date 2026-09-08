const madFormatter = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMad(amountInCentimes: number): string {
  return madFormatter.format(amountInCentimes / 100);
}
