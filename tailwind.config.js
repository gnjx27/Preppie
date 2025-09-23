/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins_400Regular'],
        'poppins-medium': ['Poppins_500Medium'],
        'poppins-semibold': ['Poppins_600SemiBold'],
        'poppins-bold': ['Poppins_700Bold'],
        courgette: ['Courgette_400Regular'],
        'courgette-medium': ['Courgette_500Medium'],
        'courgette-semibold': ['Courgette_600SemiBold'],
        'courgette-bold': ['Courgette_700Bold'],
      },
    },
  },
  plugins: [],
}