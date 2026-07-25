import { findPresentedVehicle } from "@/lib/site-content";

export function getVehiclePresentation(brand: string, model: string) {
  return findPresentedVehicle(brand, model);
}

export function enrichVehicleCard<
  T extends { brand: string; model: string; name: string; category: string; href: string },
>(card: T) {
  const presentation = findPresentedVehicle(card.brand, card.model);

  return {
    ...card,
    image: presentation?.image ?? "/ev-placeholder.svg",
    imageAlt: presentation?.imageAlt ?? card.name,
    tagline: presentation?.tagline,
  };
}
