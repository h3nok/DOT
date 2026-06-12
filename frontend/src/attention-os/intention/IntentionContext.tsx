import React, { createContext, useContext, useState } from "react";

export interface SessionIntention {
  statement: string;
  budgetMinutes: number;
  startedAt: number;
  completedAt?: number;
}

interface IntentionContextValue {
  intention: SessionIntention | null;
  startIntention: (statement: string, budgetMinutes: number) => void;
  completeIntention: () => void;
  clearIntention: () => void;
}

const IntentionContext = createContext<IntentionContextValue | null>(null);

export const IntentionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [intention, setIntention] = useState<SessionIntention | null>(null);

  const startIntention = (statement: string, budgetMinutes: number) => {
    setIntention({ statement, budgetMinutes, startedAt: Date.now() });
  };

  const completeIntention = () => {
    setIntention((currentIntention) =>
      currentIntention
        ? { ...currentIntention, completedAt: Date.now() }
        : null,
    );
  };

  const clearIntention = () => {
    setIntention(null);
  };

  return (
    <IntentionContext.Provider
      value={{ intention, startIntention, completeIntention, clearIntention }}
    >
      {children}
    </IntentionContext.Provider>
  );
};

export const useIntention = () => {
  const context = useContext(IntentionContext);
  if (!context) {
    throw new Error("useIntention must be used within an IntentionProvider");
  }

  return context;
};
