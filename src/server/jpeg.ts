// JPEG checks for customer uploads. The browser already re-encodes every photo (which drops EXIF/GPS),
// but the server never trusts that: it accepts JPEG only and strips metadata segments again before storing.

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === SOI && bytes[2] === 0xff;
}

/** HEIC/HEIF/AVIF files are ISO-BMFF containers: bytes 4–8 read "ftyp". Used only for a clearer error. */
export function isIsoMediaImage(bytes: Uint8Array): boolean {
  return bytes.length > 12 && String.fromCharCode(...bytes.subarray(4, 8)) === 'ftyp';
}

// APP1–APP13, APP15 (EXIF, XMP, ICC, IPTC/Photoshop…) and COM comments. APP0 (JFIF) and
// APP14 (Adobe colour transform, needed to decode some files correctly) are kept.
function isMetadataSegment(marker: number): boolean {
  return (marker >= 0xe1 && marker <= 0xed) || marker === 0xef || marker === 0xfe;
}

/**
 * Returns a copy of the JPEG without metadata segments, or null if the file isn't a well-formed JPEG.
 * Everything from the start-of-scan marker onwards (the compressed image) is copied unchanged.
 */
export function stripJpegMetadata(input: Uint8Array): Uint8Array | null {
  if (!isJpeg(input)) return null;

  const parts: Uint8Array[] = [input.subarray(0, 2)];
  let i = 2;

  while (i + 1 < input.length) {
    if (input[i] !== 0xff) return null;
    const marker = input[i + 1];

    // Fill bytes before a marker.
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === SOS) {
      parts.push(input.subarray(i));
      return concat(parts);
    }
    if (marker === EOI) {
      parts.push(input.subarray(i, i + 2));
      return concat(parts);
    }
    if (i + 3 >= input.length) return null;

    const length = (input[i + 2] << 8) | input[i + 3];
    const end = i + 2 + length;
    if (length < 2 || end > input.length) return null;

    if (!isMetadataSegment(marker)) parts.push(input.subarray(i, end));
    i = end;
  }

  return null;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
