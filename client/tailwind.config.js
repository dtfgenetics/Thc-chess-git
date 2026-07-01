/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                kush: {
                    parchment: "#F5E7C8",
                    cream: "#FFF8E6",
                    green: "#123D23",
                    forest: "#0B2616",
                    leaf: "#2E7D32",
                    gold: "#D4A017",
                    amber: "#C8791A",
                    ember: "#B43A2E"
                }
            }
        }
    },
    plugins: [require("daisyui")],
    darkMode: ["class", '[data-theme="kushKingsDark"]'],
    daisyui: {
        themes: [
            {
                kushKingsLight: {
                    primary: "#1F6F3A",
                    secondary: "#D4A017",
                    accent: "#7A4E18",
                    neutral: "#38523C",
                    "base-100": "#FFF8E6",
                    "base-200": "#F5E7C8",
                    "base-300": "#E4CFA4",
                    "base-content": "#1D2419",
                    info: "#6BAA75",
                    success: "#2E7D32",
                    warning: "#C8791A",
                    error: "#B43A2E"
                },
                kushKingsDark: {
                    primary: "#4CAF50",
                    secondary: "#D4A017",
                    accent: "#C8791A",
                    neutral: "#123D23",
                    "base-100": "#0B2616",
                    "base-200": "#123D23",
                    "base-300": "#1D3F27",
                    "base-content": "#FFF8E6",
                    info: "#6BAA75",
                    success: "#4CAF50",
                    warning: "#D4A017",
                    error: "#E05A47"
                }
            }
        ],
        darkTheme: "kushKingsDark"
    }
};
