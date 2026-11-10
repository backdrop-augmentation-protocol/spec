import { readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const pkg = await readJson(join(root, 'package.json'));
const releaseRoot = join(root, 'versions', pkg.version);
const index = await readJson(join(releaseRoot, 'index.json'));

if (index.package.name !== pkg.name || index.package.version !== pkg.version) {
  throw new Error('Package and release index identity do not match');
}
const coreIndex = await readJson(join(releaseRoot, index.coreIndex));
if (index.protocol.name !== coreIndex.protocol.name || index.protocol.version !== coreIndex.protocol.version || index.protocol.profile !== coreIndex.protocol.profile) {
  throw new Error('Release index Core identity does not match its referenced Core release');
}
await access(join(root, coreIndex.profile));
for (const path of Object.values(index.coreHostRuntimeApi ?? {})) await access(join(releaseRoot, path));
for (const path of Object.values(index.desktopComposition ?? {})) await access(join(releaseRoot, path));
for (const path of Object.values(index.schemas)) await readJson(join(releaseRoot, path));
for (const path of index.fixtures) await readJson(join(releaseRoot, path));
await readJson(join(root, 'profiles', 'we-web-workshop', 'project.schema.json'));

const draftRoot = join(root, 'drafts', '0.2.0');
const draftIndex = await readJson(join(draftRoot, 'index.json'));
for (const path of Object.values(draftIndex.coreHostRuntimeApi ?? {})) await access(join(draftRoot, path));
for (const path of Object.values(draftIndex.desktopComposition ?? {})) await access(join(draftRoot, path));
for (const path of Object.values(draftIndex.schemas)) await readJson(join(draftRoot, path));
for (const path of draftIndex.fixtures) await readJson(join(draftRoot, path));
console.log(`Spec package ${pkg.version}, Core ${index.protocol.version}, and extension schemas/fixtures are readable`);
