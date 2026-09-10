import type { Metadata } from "next";

import { OrderConfirmation } from "@/components/store/order-confirmation";

export const metadata: Metadata = {
  title: "Commande confirmée",
  description: "Confirmation de ta commande Peakfit.",
  robots: { index: false, follow: false },
};

export default function OrderConfirmationPage() {
  return (
    <section className="page-shell py-12 sm:py-16">
      <OrderConfirmation />
    </section>
  );
}
