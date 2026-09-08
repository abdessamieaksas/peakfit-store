export type ShippingQuote = {
  zoneCode: string;
  zoneName: string;
  city: string;
  fee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isFree: boolean;
};
