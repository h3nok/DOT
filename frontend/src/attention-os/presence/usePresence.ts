export interface PresenceSignal {
  id: string;
  label: string;
  status: "available" | "focusing" | "away";
}

export const usePresence = () => {
  const signals: PresenceSignal[] = [];

  return {
    signals,
    hasAmbientSignals: signals.length > 0,
  };
};
