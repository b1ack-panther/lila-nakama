/** @type {import('tailwindcss').Config} */
module.exports = {
	// NOTE: Update this to include the paths to all files that contain Nativewind classes.
	content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
	darkMode: "class",
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				"color-background": "#0a0f1f",
				"color-surface": "#111827",
				"color-surface-light": "#1e293b",
				"color-primary": "#22d3ee",
				"color-primary-dark": "#0ea5e9",
				"color-accent": "#a855f7",
				"color-accent-dark": "#7e22ce",
				"color-text": "#e2e8f0",
				"color-text-secondary": "#94a3b8",
				"color-border": "#1e293b",
				"color-success": "#10b981",
				"color-error": "#ef4444",
				"color-warning": "#f59e0b",
				'neon-blue': '#00F0FF',
				'neon-purple': '#B026FF',
				'neon-pink': '#FF00C1',
				'neon-green': '#39FF14',
				'neon-yellow': '#F0FF00',
			},
			keyframes: {
				glow: {
					'0%, 100%': { textShadow: '0 0 2px #00F0FF, 0 0 4px #00F0FF, 0 0 5px #00F0FF, 0 0 5px #00F0FF' },
					'50%': { textShadow: '0 0 3px #B026FF, 0 0 5px #B026FF, 0 0 5px #B026FF, 0 0 10px #B026FF' }
				},
				borderGlow: {
					'0%, 100%': { boxShadow: '0 0 5px #00F0FF, 0 0 10px #00F0FF, 0 0 15px #00F0FF, 0 0 20px #00F0FF' },
					'50%': { boxShadow: '0 0 10px #B026FF, 0 0 20px #B026FF, 0 0 30px #B026FF, 0 0 40px #B026FF' }
				}
			},
			animation: {
				glow: 'glow 1.5s ease-in-out infinite alternate',
				borderGlow: 'borderGlow 1.5s ease-in-out infinite alternate'
			}
		},
	},
	plugins: [],
};
