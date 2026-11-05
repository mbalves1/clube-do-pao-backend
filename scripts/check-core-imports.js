// Falha (exit 1) se algum arquivo de src/core importar outra camada ou um
// framework externo. Ver "Padrões obrigatórios" em docs/architecture.md.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const CORE = path.join(SRC, 'core');

const FORBIDDEN_LAYERS = ['infra', 'main', 'middlewares'];
const FORBIDDEN_PACKAGES = ['@prisma/client', 'express', '@supabase/supabase-js'];

const IMPORT_PATTERN =
	/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;

function listTsFiles(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) return listTsFiles(fullPath);
		return entry.name.endsWith('.ts') ? [fullPath] : [];
	});
}

function findViolation(file, specifier) {
	if (specifier.startsWith('.')) {
		const relative = path.relative(SRC, path.resolve(path.dirname(file), specifier));
		const layer = relative.split(path.sep)[0];
		return FORBIDDEN_LAYERS.includes(layer) ? `camada ${layer}/` : null;
	}

	const blocked = FORBIDDEN_PACKAGES.find(
		(name) => specifier === name || specifier.startsWith(`${name}/`),
	);
	return blocked ? `pacote ${blocked}` : null;
}

const violations = [];

for (const file of listTsFiles(CORE)) {
	const lines = fs.readFileSync(file, 'utf8').split('\n');
	lines.forEach((line, index) => {
		for (const [, specifier] of line.matchAll(IMPORT_PATTERN)) {
			const reason = findViolation(file, specifier);
			if (reason) {
				violations.push(
					`${path.relative(ROOT, file)}:${index + 1} importa ${reason} ('${specifier}')`,
				);
			}
		}
	});
}

if (violations.length > 0) {
	console.error('src/core não pode depender de outras camadas nem de frameworks:\n');
	violations.forEach((violation) => console.error(`  ${violation}`));
	process.exit(1);
}

console.log('src/core sem imports proibidos.');
