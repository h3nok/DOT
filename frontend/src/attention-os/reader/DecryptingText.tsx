import React, { useEffect, useState } from "react";

interface DecryptingTextProps {
  text: string;
  active: boolean;
}

export const DecryptingText: React.FC<DecryptingTextProps> = ({
  text,
  active,
}) => {
  const [displayText, setDisplayText] = useState("");
  const chars = "01ABCDEFθλΞΨΩX■_•/@#*+-%";

  useEffect(() => {
    if (!active) {
      setDisplayText(text);
      return;
    }

    let iterations = 0;
    const interval = window.setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((_letter, index) => {
            if (index < iterations) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join(""),
      );

      if (iterations >= text.length) {
        window.clearInterval(interval);
      }

      iterations += 1 / 2;
    }, 45);

    return () => window.clearInterval(interval);
  }, [active, text]);

  return (
    <span className="font-mono tracking-widest uppercase">{displayText}</span>
  );
};
