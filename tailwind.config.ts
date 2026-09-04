import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14171A",
        paper: "#F7F5F0",
        signal: "#2F5D50", // verde profundo — "conversa em andamento"
        signalSoft: "#E4ECE9",
        alert: "#B4472B", // terracota queimado — usado só para estados de atenção/erro
        line: "#DAD6CC",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
