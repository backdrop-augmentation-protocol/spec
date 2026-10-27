import { readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const pkg = await readJson(join(root, 'package.json'));
const versionRoot = join(root, 'versions', pkg.version);
const index = await readJson(join(versionRoot, 'index.json'));

if (index.package.name !== pkg.name || index.package.version !== pkg.version || index.protocol.version !== pkg.version) {
  throw new Error('Package and Core index identity do not match');
}
await access(join(root, index.profile));
for (const path of Object.values(index.schemas)) await readJson(join(versionRoot, path));
for (const path of Object.values(index.fixtures)) await readJson(join(versionRoot, path));
await readJson(join(root, 'profiles', 'we-web-workshop', 'project.schema.json'));
console.log(`Core ${pkg.version}: index, schemas, fixtures, and WE profile are readable`);
