import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const reviewed = {
  'marks-pane@1.0.9': { packageJson: '09ad68a28c8d7ec8f115d0d79a1f66f6626d089d7831b983eee23d8d59ed0898', gitHead: '2f5bb3ccfb237a2575e12c4db9188651a0b21d9a' },
  'path-webpack@0.0.3': { packageJson: '80ced94cd0276b29e3499ec7c07f1c65f66a6a957d1e01b1a47a45bdd04cfd22', gitHead: 'a8e7bf91e3646e3265c69fe4e8d414aad41b3e30' },
};

/** Exact publication declarations are distinct from extracted original LICENSE files. */
export async function declaredSpdxNotice(metadata, { directory } = {}) {
  const id = `${metadata.name}@${metadata.version}`;
  const entry = reviewed[id];
  if (!entry) return null;
  const prefix = `${metadata.name}-${metadata.version}`;
  const base = new URL('./materials/packages/build-support/licenses/declarations/', import.meta.url);
  const proof = JSON.parse(await readFile(new URL(`${prefix}.json`, base)));
  const packageBytes = await readFile(new URL(`${prefix}.PACKAGE.json`, base));
  assert.equal(hash(packageBytes), entry.packageJson, `Published metadata changed: ${id}`);
  assert.equal(proof.packageJsonSha256, entry.packageJson);
  assert.equal(proof.gitHead, entry.gitHead);
  assert.equal(metadata.license, 'MIT', `SPDX declaration changed: ${id}`);
  assert.deepEqual(metadata.author, JSON.parse(packageBytes).author, `Publisher author metadata changed: ${id}`);
  assert.deepEqual(proof.independentLicenseFiles, []);
  if (directory) {
    assert.equal(hash(await readFile(join(directory, 'package.json'))), entry.packageJson, `Installed publication differs: ${id}`);
    assert.ok(!(await readdir(directory)).some(file => /^(?:licen[cs]e|copying)(?:[._-]|$)/i.test(file)), `Preserve the newly present original LICENSE instead: ${id}`);
  }
  const standard = await readFile(new URL('SPDX-MIT-standard.txt', base));
  assert.equal(hash(standard), 'b05785f9f18e6716bab63424b11454513b9943a222595b70411009202fc592b5');
  const sections = [
    'SPDX MIT标准文本，呈现该发布包声明，非从该包独立LICENSE抽取',
    'SPDX MIT standard text presenting the exact publication declaration; not extracted from a separate LICENSE in this package.',
    'Status: verified MIT declaration; separate LICENSE file absent; truthful notice supplement supplied.',
    `Package: ${id}`, `Published license field: ${JSON.stringify(metadata.license)}`,
    `Published author metadata (not a copyright-holder assertion): ${JSON.stringify(proof.author)}`,
    `Registry author metadata: ${JSON.stringify(proof.registryAuthor)}`,
    `Registry: ${proof.registryUrl}`, `Tarball: ${proof.tarballUrl}`,
    `Integrity: ${proof.integrity}`, `SHA-1: ${proof.shasum}`, `Tarball SHA-256: ${proof.tarballSha256}`,
    `gitHead: ${proof.gitHead}`, `Exact published package.json SHA-256: ${proof.packageJsonSha256}`,
    'Standard source: https://spdx.org/licenses/MIT.html',
    'No copyright holder or year has been inferred or inserted; the standard template placeholders remain literal.',
    '', standard.toString('utf8'),
  ];
  const originalNotices = [];
  if (metadata.name === 'path-webpack') {
    const bytes = await readFile(new URL('Node-v7.0.0-LICENSE.txt', base));
    assert.equal(hash(bytes), '1914bfb950be8d576ce9e49c8a0e51c9f2402560fe3c19093e69bc1306a56e9e');
    sections.push('--- Actual original Node v7.0.0 copyright notices and license ---',
      'Source: https://github.com/nodejs/node/blob/v7.0.0/LICENSE',
      'The publication README identifies Node v7.0.0 lib/path.js as its origin. The following Node/Joyent text is retained for that origin; it is not claimed to be a recovered license for all fork modifications.',
      `SHA-256: ${hash(bytes)}`, bytes.toString('utf8'));
    originalNotices.push({ component: 'Node.js v7.0.0', sha256: hash(bytes), source: 'https://github.com/nodejs/node/blob/v7.0.0/LICENSE' });
  } else {
    const prior = JSON.parse(await readFile(new URL('marks-predecessor.json', base)));
    const bytes = await readFile(new URL('marks-predecessor.PACKAGE.json', base));
    assert.equal(hash(bytes), prior.sha256);
    assert.equal(prior.author, 'Nick Stenning');
    assert.equal(prior.declaredLicense, 'MIT');
    assert.equal(prior.inCurrentForkHistory, true);
    sections.push('--- Proven predecessor source attribution ---',
      `Source: ${prior.url}`, `Commit in current fork history: ${prior.commit}`,
      `Original predecessor author metadata: ${JSON.stringify(prior.author)}`,
      `Original predecessor license declaration: ${prior.declaredLicense}`,
      `Predecessor package.json SHA-256: ${prior.sha256}`,
      'This preserves Nick Stenning source attribution. Publisher author metadata is not substituted for an original copyright notice.');
  }
  return {
    kind: 'verified-published-SPDX-declaration-notice', independentLicenseFile: 'absent', originalLicenseRecovered: false,
    name: metadata.name, version: metadata.version, declaredLicense: 'MIT', packageJsonSha256: entry.packageJson,
    gitHead: entry.gitHead, registryUrl: proof.registryUrl, tarballSha256: proof.tarballSha256,
    standardSource: 'https://spdx.org/licenses/MIT.html', standardSha256: hash(standard), originalNotices,
    text: sections.join('\n') + '\n',
  };
}
