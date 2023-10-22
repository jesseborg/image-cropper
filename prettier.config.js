/** @type {import('prettier').Config} */
export default {
	useTabs: true,
	tabWidth: 2,
	semi: true,
	printWidth: 100,
	singleQuote: true,
	trailingComma: 'none',
	bracketSpacing: true,
	bracketSameLine: false,
	arrowParens: 'always',
	endOfLine: 'auto',
	quoteProps: 'consistent',
	plugins: [import('prettier-plugin-tailwindcss')]
};
