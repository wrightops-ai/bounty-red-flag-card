#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync, gunzipSync, gzipSync, inflateRawSync } from "node:zlib";

const productsRoot = dirname(fileURLToPath(import.meta.url));
const manifestName = "product-manifest.json";
const checksumName = "SHA256SUMS";
const utf8Flag = 0x0800;
const zipMethodDeflate = 8;

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function archiveMode(stats) {
  return stats.mode & 0o111 ? "0755" : "0644";
}

function modeNumber(mode) {
  assert.match(mode, /^0(?:644|755)$/);
  return Number.parseInt(mode, 8);
}

function normalizeRelativePath(path) {
  return path.split(sep).join("/");
}

async function scanSource(productRoot) {
  const inventory = [];

  async function visit(directory, prefix = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (relativePath === manifestName || relativePath === "dist") {
        continue;
      }

      const absolutePath = join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Release sources may not contain symbolic links: ${relativePath}`);
      }
      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath);
        continue;
      }
      if (!entry.isFile()) {
        throw new Error(`Unsupported release source type: ${relativePath}`);
      }

      const [data, fileStats] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
      inventory.push({
        path: normalizeRelativePath(relativePath),
        sha256: sha256(data),
        bytes: data.length,
        archiveMode: archiveMode(fileStats)
      });
    }
  }

  await visit(productRoot);
  return inventory.sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function validateManifestShape(manifest, productRoot) {
  assert.equal(manifest.schemaVersion, 1, "Manifest schemaVersion must be 1.");
  assert.equal(manifest.slug, basename(productRoot), "Manifest slug must match its product directory.");
  assert.equal(typeof manifest.product, "string");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(typeof manifest.price.amount, "number");
  assert.equal(manifest.price.currency, "USD");

  assert.deepEqual(manifest.license, {
    spdx: "MIT",
    file: "LICENSE"
  });
  assert.deepEqual(manifest.publisher, {
    name: "WrightOps",
    capacity: "Owner-authorized operating brand",
    incorporatedEntityClaim: false
  });
  assert.equal(manifest.provenance.classification, "owner-authorized first-party");
  assert.equal(manifest.provenance.thirdPartyRuntimeContent, false);
  assert.equal(manifest.runtime.thirdPartyRuntimeContent, false);
  assert.deepEqual(manifest.runtime.dependencies, []);
  assert.equal(manifest.rightsAndResale.license, "MIT");
  assert.equal(manifest.rightsAndResale.resalePermitted, true);
  assert.equal(manifest.rightsAndResale.exclusiveRightsTransferred, false);
  assert.equal(manifest.rightsAndResale.thirdPartyContentIncluded, false);

  assert.equal(manifest.release.sourceDateEpoch, 946684800);
  assert.equal(
    manifest.release.inventoryScope,
    "Every regular file under the product directory except product-manifest.json and generated dist/ outputs."
  );
  assert.deepEqual(manifest.release.manifestSelfReference, {
    excludedFromSourceInventory: true,
    rationale:
      "The manifest cannot contain its own SHA-256 without an impossible self-reference; it is included in every archive and validated structurally instead."
  });
  assert.deepEqual(manifest.release.generatedOutputExclusion, {
    path: "dist/",
    rationale:
      "Archives and SHA256SUMS are deterministic build outputs, not source inputs, so they are excluded from the source inventory and from the archives themselves."
  });
  assert.equal(manifest.release.checksumFile, "dist/SHA256SUMS");
  assert.ok(Array.isArray(manifest.release.sourceInventory));
  assert.ok(Array.isArray(manifest.release.archives));
  assert.ok(manifest.release.archives.length >= 2);

  const formats = new Set();
  const archiveNames = new Set();
  for (const archive of manifest.release.archives) {
    assert.equal(archive.buildCommand, "npm run build:release");
    assert.equal(archive.name, basename(archive.name));
    assert.match(archive.rootDirectory, /^(?:package|[a-z0-9]+(?:-[a-z0-9]+)*)$/);
    assert.ok(["zip", "tar.gz", "npm-tgz"].includes(archive.format));
    assert.equal(archiveNames.has(archive.name), false, `Duplicate archive name: ${archive.name}`);
    archiveNames.add(archive.name);
    formats.add(archive.format);
  }
  assert.equal(formats.has("zip"), true, "A ZIP release is required.");
  assert.equal(formats.has("tar.gz"), true, "A tar.gz release is required.");
}

function validateInventory(inventory) {
  const paths = new Set();
  for (const item of inventory) {
    assert.match(item.path, /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$)).+$/);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(item.bytes) && item.bytes >= 0);
    assert.match(item.archiveMode, /^0(?:644|755)$/);
    assert.equal(paths.has(item.path), false, `Duplicate inventory path: ${item.path}`);
    paths.add(item.path);
  }
  assert.deepEqual(
    inventory.map((item) => item.path),
    [...paths].sort((left, right) => left.localeCompare(right, "en")),
    "Source inventory must be sorted by path."
  );
}

function scanForSensitiveMaterial(path, data) {
  if (data.includes(0)) {
    return;
  }
  const text = data.toString("utf8");
  const forbidden = [
    [/(?:^|[\s"'`(])\/Users\/[A-Za-z0-9._-]+\//m, "local macOS absolute path"],
    [/(?:^|[\s"'`(])\/home\/[A-Za-z0-9._-]+\//m, "local Linux absolute path"],
    [/[A-Za-z]:\\Users\\[A-Za-z0-9._-]+\\/m, "local Windows absolute path"],
    [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key"],
    [/\bgh[opusr]_[A-Za-z0-9]{20,}\b/, "GitHub credential"],
    [/\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/, "payment credential"],
    [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, "Slack credential"],
    [/\bAKIA[A-Z0-9]{16}\b/, "AWS access key"]
  ];
  for (const [pattern, label] of forbidden) {
    assert.doesNotMatch(text, pattern, `${path} contains a ${label}.`);
  }
}

async function loadReleaseEntries(productRoot, inventory) {
  const entries = [];
  for (const item of inventory) {
    const data = await readFile(join(productRoot, item.path));
    scanForSensitiveMaterial(item.path, data);
    entries.push({ path: item.path, data, mode: item.archiveMode });
  }
  const manifestData = await readFile(join(productRoot, manifestName));
  scanForSensitiveMaterial(manifestName, manifestData);
  entries.push({ path: manifestName, data: manifestData, mode: "0644" });
  return entries.sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function dosDateTime(epoch) {
  const date = new Date(epoch * 1000);
  const year = date.getUTCFullYear();
  assert.ok(year >= 1980 && year <= 2107, "ZIP timestamp year must fit the DOS format.");
  return {
    date:
      ((year - 1980) << 9) |
      ((date.getUTCMonth() + 1) << 5) |
      date.getUTCDate(),
    time:
      (date.getUTCHours() << 11) |
      (date.getUTCMinutes() << 5) |
      Math.floor(date.getUTCSeconds() / 2)
  };
}

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(entries, rootDirectory, epoch) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const timestamp = dosDateTime(epoch);

  for (const entry of entries) {
    const name = Buffer.from(`${rootDirectory}/${entry.path}`, "utf8");
    const compressed = deflateRawSync(entry.data, { level: 9 });
    const crc = crc32(entry.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(utf8Flag, 6);
    local.writeUInt16LE(zipMethodDeflate, 8);
    local.writeUInt16LE(timestamp.time, 10);
    local.writeUInt16LE(timestamp.date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(utf8Flag, 8);
    central.writeUInt16LE(zipMethodDeflate, 10);
    central.writeUInt16LE(timestamp.time, 12);
    central.writeUInt16LE(timestamp.date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(((0o100000 | modeNumber(entry.mode)) << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function writeTarString(header, offset, length, value) {
  const encoded = Buffer.from(value, "utf8");
  assert.ok(encoded.length <= length, `TAR field is too long: ${value}`);
  encoded.copy(header, offset);
}

function writeTarOctal(header, offset, length, value) {
  const encoded = `${value.toString(8).padStart(length - 1, "0")}\0`;
  assert.equal(encoded.length, length, `TAR numeric field overflow: ${value}`);
  writeTarString(header, offset, length, encoded);
}

function buildTar(entries, rootDirectory, epoch) {
  const parts = [];
  for (const entry of entries) {
    const name = `${rootDirectory}/${entry.path}`;
    const header = Buffer.alloc(512);
    writeTarString(header, 0, 100, name);
    writeTarOctal(header, 100, 8, modeNumber(entry.mode));
    writeTarOctal(header, 108, 8, 0);
    writeTarOctal(header, 116, 8, 0);
    writeTarOctal(header, 124, 12, entry.data.length);
    writeTarOctal(header, 136, 12, epoch);
    header.fill(0x20, 148, 156);
    header[156] = "0".charCodeAt(0);
    writeTarString(header, 257, 6, "ustar\0");
    writeTarString(header, 263, 2, "00");
    writeTarOctal(header, 329, 8, 0);
    writeTarOctal(header, 337, 8, 0);
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    writeTarString(header, 148, 8, `${checksum.toString(8).padStart(6, "0")}\0 `);
    parts.push(header, entry.data);
    const padding = (512 - (entry.data.length % 512)) % 512;
    if (padding) {
      parts.push(Buffer.alloc(padding));
    }
  }
  parts.push(Buffer.alloc(1024));
  return Buffer.concat(parts);
}

function deterministicGzip(data) {
  const compressed = gzipSync(data, { level: 9, mtime: 0 });
  compressed.writeUInt32LE(0, 4);
  compressed[9] = 255;
  return compressed;
}

function parseTarOctal(buffer, offset, length) {
  const value = buffer
    .subarray(offset, offset + length)
    .toString("ascii")
    .replace(/\0.*$/s, "")
    .trim();
  return value ? Number.parseInt(value, 8) : 0;
}

function parseTarString(buffer, offset, length) {
  return buffer
    .subarray(offset, offset + length)
    .toString("utf8")
    .replace(/\0.*$/s, "");
}

function readTarArchive(compressed, epoch) {
  assert.equal(compressed[0], 0x1f);
  assert.equal(compressed[1], 0x8b);
  assert.equal(compressed[2], 8);
  assert.equal(compressed[3], 0, "GZIP archive must not include optional local metadata.");
  assert.equal(compressed.readUInt32LE(4), 0, "GZIP mtime must be zero.");
  assert.equal(compressed[9], 255, "GZIP operating-system byte must be normalized.");

  const tar = gunzipSync(compressed);
  const entries = [];
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      assert.equal(
        tar.subarray(offset).every((byte) => byte === 0),
        true,
        "TAR trailer must contain only zero blocks."
      );
      break;
    }

    const storedChecksum = parseTarOctal(header, 148, 8);
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    const calculatedChecksum = checksumHeader.reduce((sum, byte) => sum + byte, 0);
    assert.equal(storedChecksum, calculatedChecksum, "TAR header checksum mismatch.");
    assert.equal(parseTarString(header, 257, 6), "ustar");
    assert.equal(parseTarString(header, 263, 2), "00");
    assert.equal(header[156], "0".charCodeAt(0));
    assert.equal(parseTarOctal(header, 108, 8), 0, "TAR uid must be zero.");
    assert.equal(parseTarOctal(header, 116, 8), 0, "TAR gid must be zero.");
    assert.equal(parseTarString(header, 265, 32), "", "TAR uname must be empty.");
    assert.equal(parseTarString(header, 297, 32), "", "TAR gname must be empty.");
    assert.equal(parseTarOctal(header, 136, 12), epoch, "TAR mtime must use sourceDateEpoch.");

    const size = parseTarOctal(header, 124, 12);
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    assert.ok(dataEnd <= tar.length, "TAR entry extends beyond the archive.");
    entries.push({
      path: parseTarString(header, 0, 100),
      data: tar.subarray(dataStart, dataEnd),
      mode: parseTarOctal(header, 100, 8)
    });
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  assert.ok(entries.length > 0, "TAR archive must contain files.");
  return entries;
}

function findEndOfCentralDirectory(zip) {
  const minimum = Math.max(0, zip.length - 65557);
  for (let offset = zip.length - 22; offset >= minimum; offset -= 1) {
    if (zip.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }
  throw new Error("ZIP end-of-central-directory record not found.");
}

function readZipArchive(zip, epoch) {
  const endOffset = findEndOfCentralDirectory(zip);
  assert.equal(endOffset + 22, zip.length, "ZIP must not include an archive comment or trailing bytes.");
  assert.equal(zip.readUInt16LE(endOffset + 4), 0);
  assert.equal(zip.readUInt16LE(endOffset + 6), 0);
  const entryCount = zip.readUInt16LE(endOffset + 10);
  assert.equal(zip.readUInt16LE(endOffset + 8), entryCount);
  assert.equal(zip.readUInt16LE(endOffset + 20), 0);
  const centralSize = zip.readUInt32LE(endOffset + 12);
  let centralOffset = zip.readUInt32LE(endOffset + 16);
  assert.equal(centralOffset + centralSize, endOffset);

  const expectedTimestamp = dosDateTime(epoch);
  const entries = [];
  for (let index = 0; index < entryCount; index += 1) {
    assert.equal(zip.readUInt32LE(centralOffset), 0x02014b50);
    assert.equal(zip.readUInt16LE(centralOffset + 4), (3 << 8) | 20);
    assert.equal(zip.readUInt16LE(centralOffset + 6), 20);
    assert.equal(zip.readUInt16LE(centralOffset + 8), utf8Flag);
    assert.equal(zip.readUInt16LE(centralOffset + 10), zipMethodDeflate);
    assert.equal(zip.readUInt16LE(centralOffset + 12), expectedTimestamp.time);
    assert.equal(zip.readUInt16LE(centralOffset + 14), expectedTimestamp.date);
    const crc = zip.readUInt32LE(centralOffset + 16);
    const compressedSize = zip.readUInt32LE(centralOffset + 20);
    const size = zip.readUInt32LE(centralOffset + 24);
    const nameLength = zip.readUInt16LE(centralOffset + 28);
    const extraLength = zip.readUInt16LE(centralOffset + 30);
    const commentLength = zip.readUInt16LE(centralOffset + 32);
    assert.equal(extraLength, 0, "ZIP entries must not contain extra metadata.");
    assert.equal(commentLength, 0, "ZIP entries must not contain comments.");
    assert.equal(zip.readUInt16LE(centralOffset + 34), 0);
    assert.equal(zip.readUInt16LE(centralOffset + 36), 0);
    const externalAttributes = zip.readUInt32LE(centralOffset + 38);
    const localOffset = zip.readUInt32LE(centralOffset + 42);
    const path = zip
      .subarray(centralOffset + 46, centralOffset + 46 + nameLength)
      .toString("utf8");

    assert.equal(zip.readUInt32LE(localOffset), 0x04034b50);
    assert.equal(zip.readUInt16LE(localOffset + 4), 20);
    assert.equal(zip.readUInt16LE(localOffset + 6), utf8Flag);
    assert.equal(zip.readUInt16LE(localOffset + 8), zipMethodDeflate);
    assert.equal(zip.readUInt16LE(localOffset + 10), expectedTimestamp.time);
    assert.equal(zip.readUInt16LE(localOffset + 12), expectedTimestamp.date);
    assert.equal(zip.readUInt32LE(localOffset + 14), crc);
    assert.equal(zip.readUInt32LE(localOffset + 18), compressedSize);
    assert.equal(zip.readUInt32LE(localOffset + 22), size);
    const localNameLength = zip.readUInt16LE(localOffset + 26);
    const localExtraLength = zip.readUInt16LE(localOffset + 28);
    assert.equal(localExtraLength, 0, "ZIP local entries must not contain extra metadata.");
    assert.equal(
      zip.subarray(localOffset + 30, localOffset + 30 + localNameLength).toString("utf8"),
      path
    );
    const dataStart = localOffset + 30 + localNameLength;
    const data = inflateRawSync(zip.subarray(dataStart, dataStart + compressedSize));
    assert.equal(data.length, size);
    assert.equal(crc32(data), crc);
    entries.push({
      path,
      data,
      mode: (externalAttributes >>> 16) & 0xffff
    });
    centralOffset += 46 + nameLength + extraLength + commentLength;
  }
  assert.ok(entries.length > 0, "ZIP archive must contain files.");
  return entries;
}

function expectedArchiveEntries(entries, rootDirectory) {
  return entries.map((entry) => ({
    path: `${rootDirectory}/${entry.path}`,
    sha256: sha256(entry.data),
    bytes: entry.data.length,
    mode: 0o100000 | modeNumber(entry.mode)
  }));
}

function verifyArchiveEntries(actual, expected, format) {
  const normalizedActual = actual.map((entry) => ({
    path: entry.path,
    sha256: sha256(entry.data),
    bytes: entry.data.length,
    mode: format === "zip" ? entry.mode : 0o100000 | entry.mode
  }));
  assert.deepEqual(normalizedActual, expected, `${format} archive inventory or metadata mismatch.`);
}

function parseChecksumFile(text) {
  const rows = text.trim().split("\n").filter(Boolean);
  return rows.map((row) => {
    const match = row.match(/^([a-f0-9]{64}) {2}([A-Za-z0-9][A-Za-z0-9._-]*)$/);
    assert.ok(match, `Invalid SHA256SUMS row: ${row}`);
    return { sha256: match[1], name: match[2] };
  });
}

async function buildRelease(productRoot) {
  const manifestPath = join(productRoot, manifestName);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  validateManifestShape(manifest, productRoot);

  manifest.release.sourceInventory = await scanSource(productRoot);
  validateInventory(manifest.release.sourceInventory);
  await writeFile(manifestPath, stableJson(manifest));

  const entries = await loadReleaseEntries(productRoot, manifest.release.sourceInventory);
  const dist = join(productRoot, "dist");
  await mkdir(dist, { recursive: true });
  const checksums = [];

  for (const archive of manifest.release.archives) {
    let data;
    if (archive.format === "zip") {
      data = buildZip(entries, archive.rootDirectory, manifest.release.sourceDateEpoch);
    } else {
      data = deterministicGzip(
        buildTar(entries, archive.rootDirectory, manifest.release.sourceDateEpoch)
      );
    }
    await writeFile(join(dist, archive.name), data);
    checksums.push({ name: archive.name, sha256: sha256(data) });
  }
  checksums.sort((left, right) => left.name.localeCompare(right.name, "en"));
  await writeFile(
    join(dist, checksumName),
    `${checksums.map((item) => `${item.sha256}  ${item.name}`).join("\n")}\n`
  );
}

async function verifyRelease(productRoot) {
  const manifest = JSON.parse(await readFile(join(productRoot, manifestName), "utf8"));
  validateManifestShape(manifest, productRoot);
  validateInventory(manifest.release.sourceInventory);

  const actualInventory = await scanSource(productRoot);
  assert.deepEqual(
    actualInventory,
    manifest.release.sourceInventory,
    "Manifest source inventory does not match current source files."
  );
  const entries = await loadReleaseEntries(productRoot, actualInventory);
  const checksumRows = parseChecksumFile(
    await readFile(join(productRoot, manifest.release.checksumFile), "utf8")
  );
  assert.deepEqual(
    checksumRows.map((row) => row.name),
    manifest.release.archives
      .map((archive) => archive.name)
      .sort((left, right) => left.localeCompare(right, "en")),
    "SHA256SUMS must contain exactly one sorted row for each declared archive."
  );
  const checksumByName = new Map(checksumRows.map((row) => [row.name, row.sha256]));

  for (const archive of manifest.release.archives) {
    const data = await readFile(join(productRoot, "dist", archive.name));
    assert.equal(sha256(data), checksumByName.get(archive.name), `${archive.name} SHA-256 mismatch.`);
    const expected = expectedArchiveEntries(entries, archive.rootDirectory);
    const actual =
      archive.format === "zip"
        ? readZipArchive(data, manifest.release.sourceDateEpoch)
        : readTarArchive(data, manifest.release.sourceDateEpoch);
    verifyArchiveEntries(actual, expected, archive.format);
  }
}

function parseArguments(argv) {
  const verify = argv.includes("--verify");
  const positional = argv.filter((argument) => argument !== "--verify");
  assert.ok(positional.length <= 1, "Usage: node release-builder.mjs [--verify] [product-directory]");
  const productRoot = resolve(positional[0] ?? ".");
  assert.equal(
    dirname(productRoot),
    productsRoot,
    "The release builder may only operate on a direct product directory under products/agentmart."
  );
  return { verify, productRoot };
}

const { verify, productRoot } = parseArguments(process.argv.slice(2));
if (verify) {
  await verifyRelease(productRoot);
  console.log(`Verified deterministic release: ${basename(productRoot)}`);
} else {
  await buildRelease(productRoot);
  await verifyRelease(productRoot);
  console.log(`Built and verified deterministic release: ${basename(productRoot)}`);
}
