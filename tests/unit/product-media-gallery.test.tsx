import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProductMediaGallery } from "@/components/store/product-media-gallery";

afterEach(cleanup);

describe("product media gallery", () => {
  it("lets shoppers switch between product photos with named controls", () => {
    render(<ProductMediaGallery images={[
      { url: "/images/products/first.webp", width: 800, height: 1000, alt: "Vue de face" },
      { url: "/images/products/back.webp", width: 800, height: 1000, alt: "Vue de dos" },
    ]} />);

    expect(screen.getByRole("img", { name: "Vue de face" })).toBeInTheDocument();
    const secondPhoto = screen.getByRole("button", { name: "Voir la photo 2 sur 2" });
    fireEvent.click(secondPhoto);
    expect(secondPhoto).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: "Vue de dos" })).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });
});
