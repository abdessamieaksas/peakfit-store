export type ShippingZoneDefinition = {
  code: string;
  name: string;
  cities: string[];
  fee: number;
  freeShippingThreshold?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
};

export const sampleShippingZones: ShippingZoneDefinition[] = [
  {
    code: "casa-rabat",
    name: "Axe Casablanca–Rabat",
    cities: ["casablanca", "rabat", "sale", "mohammedia", "temara"],
    fee: 3500,
    freeShippingThreshold: 70000,
    estimatedDaysMin: 1,
    estimatedDaysMax: 2,
  },
  {
    code: "grandes-villes",
    name: "Grandes villes",
    cities: [
      "agadir",
      "fes",
      "kenitra",
      "marrakech",
      "meknes",
      "tanger",
      "tetouan",
    ],
    fee: 4500,
    freeShippingThreshold: 70000,
    estimatedDaysMin: 2,
    estimatedDaysMax: 3,
  },
  {
    code: "maroc",
    name: "Reste du Maroc",
    cities: [],
    fee: 5500,
    freeShippingThreshold: 90000,
    estimatedDaysMin: 3,
    estimatedDaysMax: 5,
  },
];
