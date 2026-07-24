import "server-only";

export type VerifiedSource = {
  id: string;
  title: string;
  url?: string;
  verifiedAt: string;
};

export type VerifiedContext = {
  content: string;
  sources: VerifiedSource[];
};

const emptyContext = (): VerifiedContext => ({ content: "", sources: [] });

/**
 * Adapter boundary for the next phase. It must return only catalogue records
 * that have been verified and are safe to expose.
 */
export async function retrieveVehicleContext(
  query: string,
): Promise<VerifiedContext> {
  void query;
  return emptyContext();
}

/**
 * Adapter boundary for current prices, availability and purchase conditions.
 */
export async function retrieveCommercialContext(
  query: string,
): Promise<VerifiedContext> {
  void query;
  return emptyContext();
}

export function buildGroundedChatContext({
  vehicle,
  commercial,
}: {
  vehicle: VerifiedContext;
  commercial: VerifiedContext;
}) {
  const sources = [...vehicle.sources, ...commercial.sources];
  const sections = [
    vehicle.content && `OVĚŘENÁ DATA O VOZECH:\n${vehicle.content}`,
    commercial.content &&
      `OVĚŘENÉ OBCHODNÍ PODMÍNKY:\n${commercial.content}`,
  ].filter(Boolean);

  return {
    content:
      sections.join("\n\n") ||
      "OVĚŘENÝ KATALOG ZATÍM NENÍ PŘIPOJEN. Nejsou k dispozici žádná ověřená data o parametrech, cenách, dostupnosti ani obchodních podmínkách.",
    sources,
  };
}
