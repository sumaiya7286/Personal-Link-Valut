import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { BlockList, isIP, type LookupFunction } from "node:net";

/*
 * SSRF guard for the link-preview fetcher.
 * Every address the server might connect to goes through isBlockedAddress().
 */

const blocked = new BlockList();

// IPv4: private, loopback, link-local, carrier-grade NAT, documentation, benchmarking, multicast, reserved.
const V4: [string, number][] = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.88.99.0", 24], // 6to4 relay anycast
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, incl. broadcast 255.255.255.255
];
for (const [net, prefix] of V4) blocked.addSubnet(net, prefix, "ipv4");

// IPv6. IPv4-mapped (::ffff:0:0/96) is not listed: it is converted to IPv4 and checked above.
const V6: [string, number][] = [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["::", 96], // deprecated IPv4-compatible (::a.b.c.d)
  ["64:ff9b::", 96], // NAT64: can reach any IPv4 address, including private ones
  ["64:ff9b:1::", 48], // local-use NAT64
  ["100::", 64], // discard-only
  ["2001::", 32], // Teredo tunnelling (embeds an IPv4 address)
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4 (embeds an IPv4 address)
  ["fc00::", 7], // unique local (private)
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
];
for (const [net, prefix] of V6) blocked.addSubnet(net, prefix, "ipv6");

/** Expands an IPv6 string (any notation, with or without brackets/zone id) to 16 bytes, or null if invalid. */
export function ipv6ToBytes(input: string): Uint8Array | null {
  let ip = input.replace(/^\[|\]$/g, "").split("%")[0];
  if (isIP(ip) !== 6) return null;

  // A trailing dotted quad (e.g. ::ffff:127.0.0.1) becomes two hex groups.
  const dotted = ip.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const [a, b, c, d] = dotted[1].split(".").map(Number);
    ip = ip.slice(0, -dotted[1].length) + `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }

  const [head, tail] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined && tail ? tail.split(":") : [];
  const groups = tail === undefined ? h : [...h, ...Array<string>(8 - h.length - t.length).fill("0"), ...t];
  if (groups.length !== 8) return null;

  const bytes = new Uint8Array(16);
  groups.forEach((g, i) => {
    const n = parseInt(g, 16);
    bytes[i * 2] = n >> 8;
    bytes[i * 2 + 1] = n & 0xff;
  });
  return bytes;
}

/** If ip is an IPv4-mapped IPv6 address (::ffff:a.b.c.d / ::ffff:7f00:1), returns the IPv4 address. */
export function unmapIPv4(ip: string): string | null {
  const b = ipv6ToBytes(ip);
  if (!b) return null;
  const isMapped = b.slice(0, 10).every((x) => x === 0) && b[10] === 0xff && b[11] === 0xff;
  return isMapped ? `${b[12]}.${b[13]}.${b[14]}.${b[15]}` : null;
}

/** True when the server must not connect to this address. Anything that isn't a valid IP is blocked (fail closed). */
export function isBlockedAddress(address: string): boolean {
  const ip = address.replace(/^\[|\]$/g, "").split("%")[0];
  const family = isIP(ip);
  if (family === 4) return blocked.check(ip, "ipv4");
  if (family === 6) {
    const v4 = unmapIPv4(ip);
    return v4 ? blocked.check(v4, "ipv4") : blocked.check(ip, "ipv6");
  }
  return true;
}

const BLOCKED_HOSTNAMES = /(^|\.)(localhost|local|internal|home\.arpa)$/i;

/**
 * Checks a URL before any request is made: http(s) only, default web ports only,
 * no embedded credentials, no internal hostnames, and no blocked IP literals.
 * Throws an Error describing the problem.
 */
export function assertSafeUrl(url: URL): void {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http and https links are allowed");
  // URL.port is "" for the scheme's default port; allow only 80 and 443.
  if (url.port !== "" && url.port !== "80" && url.port !== "443") throw new Error("Only ports 80 and 443 are allowed");
  if (url.username || url.password) throw new Error("Links with a username or password are not allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.test(host)) throw new Error("Internal hostnames are not allowed");
  if (isIP(host) && isBlockedAddress(host)) throw new Error("Private or reserved addresses are not allowed");
}

type Resolver = (
  hostname: string,
  options: { all: true; family?: number },
  callback: (err: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => void,
) => void;

/**
 * DNS lookup for the HTTP client's socket connect. It resolves the hostname once, rejects the
 * connection if any result is blocked, and hands the socket exactly those vetted addresses.
 * Because the check and the connection use the same lookup, a DNS answer that changes between
 * "check" and "connect" (DNS rebinding) can't slip a private IP through.
 */
export function createSafeLookup(resolve: Resolver = dnsLookup as unknown as Resolver): LookupFunction {
  return (hostname, options, callback) => {
    resolve(hostname, { all: true, family: options.family as number | undefined }, (err, addresses) => {
      if (err) return callback(err, "", 0);
      if (!addresses.length || addresses.some((a) => isBlockedAddress(a.address))) {
        const e: NodeJS.ErrnoException = new Error(`Blocked: ${hostname} resolves to a private or reserved address`);
        e.code = "EBLOCKED";
        return callback(e, "", 0);
      }
      if (options.all) {
        (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, addresses);
      } else {
        callback(null, addresses[0].address, addresses[0].family);
      }
    });
  };
}
