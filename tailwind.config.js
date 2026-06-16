
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],

  presets: [require('nativewind/dist/tailwind')],
  theme: {
    extend: {}
  },
  plugins: []
};