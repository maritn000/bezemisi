import { VehicleCard } from "./vehicle-card";

export function VehicleGrid({
  vehicles,
}: {
  vehicles: ReadonlyArray<{
    name: string;
    category: string;
    href?: string;
  }>;
}) {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.name} {...vehicle} />
      ))}
    </div>
  );
}
