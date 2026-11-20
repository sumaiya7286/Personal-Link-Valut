import type { LookupAddress } from "node:dns";
import { describe, expect, it } from "vitest";
import { assertSafeUrl, createSafeLookup, isBlockedAddress, unmapIPv4 } from "./ssrf";

describe("isBlockedAddress", () => {
  it.each([
    // The reported bypass: Node's URL parser rewrites [::ffff:127.0.0.1] to this form.
    ["::ffff:7f00:1", "IPv4-mapped loopback (hex form)"],
    ["::ffff:a9fe:a9fe", "IPv4-mapped cloud metadata 169.254.169.254 (hex form)"],
    ["::ffff:127.0.0.1", "IPv4-mapped loopback (dotted form)"],
    ["[::ffff:7f00:1]", "bracketed, as URL.hostname returns it"],
    ["127.0.0.1", "loopback"],
    ["10.0.0.1", "private 10/8"],
    ["172.16.0.1", "private 172.16/12"],
    ["192.168.1.1", "private 192.168/16"],
    ["169.254.169.254", "cloud metadata"],
    ["100.64.0.1", "carrier-grade NAT"],
    ["0.0.0.0", "this network"],
    ["224.0.0.1", "multicast"],
    ["255.255.255.255", "broadcast"],
    ["::", "IPv6 unspecified"],
    ["::1", "IPv6 loopback"],
    ["::7f00:1", "deprecated IPv4-compatible loopback"],
    ["fc00::1", "unique local"],
    ["fd12:3456::1", "unique local"],
    ["fe80::1", "link-local"],
    ["fe80::1%eth0", "link-local with zone id"],
    ["ff02::1", "multicast"],
    ["64:ff9b::7f00:1", "NAT64 to loopback"],
    ["2002:7f00:1::", "6to4 wrapping loopback"],
    ["not-an-ip", "not an IP at all (fail closed)"],
  ])("blocks %s (%s)", (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each([
    ["8.8.8.8", "Google DNS"],
    ["1.1.1.1", "Cloudflare DNS"],
    ["2606:4700::1111", "Cloudflare DNS over IPv6"],
    ["2001:4860:4860::8888", "Google DNS over IPv6"],
    ["::ffff:8.8.8.8", "IPv4-mapped public address"],
    ["::ffff:808:808", "IPv4-mapped public address (hex form)"],
  ])("allows %s (%s)", (ip) => {
    expect(isBlockedAddress(ip)).toBe(false);
  });
});

describe("unmapIPv4", () => {
  it("converts IPv4-mapped IPv6 in either notation", () => {
    expect(unmapIPv4("::ffff:7f00:1")).toBe("127.0.0.1");
    expect(unmapIPv4("::ffff:a9fe:a9fe")).toBe("169.254.169.254");
    expect(unmapIPv4("::ffff:127.0.0.1")).toBe("127.0.0.1");
    expect(unmapIPv4("0:0:0:0:0:ffff:0a00:0001")).toBe("10.0.0.1");
  });

  it("returns null for anything that isn't IPv4-mapped", () => {
    expect(unmapIPv4("2606:4700::1111")).toBeNull();
    expect(unmapIPv4("::1")).toBeNull();
    expect(unmapIPv4("127.0.0.1")).toBeNull();
  });
});

describe("assertSafeUrl", () => {
  it("catches the bypass after Node's URL parser normalises the host", () => {
    for (const raw of ["http://[::ffff:127.0.0.1]/", "http://[::ffff:169.254.169.254]/latest/meta-data/"]) {
      const url = new URL(raw);
      expect(url.hostname).toMatch(/^\[::ffff:[0-9a-f]+:[0-9a-f]+\]$/);
      expect(() => assertSafeUrl(url)).toThrow(/private or reserved/i);
    }
  });

  it.each([
    "http://127.0.0.1/",
    "http://0x7f.1/", // parser turns this into 127.0.0.1
    "http://2130706433/", // and this
    "http://[::1]/",
    "http://10.0.0.1/",
  ])("rejects internal IP literal %s", (raw) => {
    expect(() => assertSafeUrl(new URL(raw))).toThrow(/private or reserved/i);
  });

  it.each(["http://localhost/", "http://printer.local/", "http://db.internal/", "http://router.home.arpa/"])(
    "rejects internal hostname %s",
    (raw) => {
      expect(() => assertSafeUrl(new URL(raw))).toThrow(/internal hostnames/i);
    },
  );

  it.each(["http://example.com:8080/", "https://example.com:22/", "http://example.com:6379/"])(
    "rejects non-web port %s",
    (raw) => {
      expect(() => assertSafeUrl(new URL(raw))).toThrow(/ports 80 and 443/i);
    },
  );

  it.each(["https://user@example.com/", "https://user:pass@example.com/", "https://:secret@example.com/"])(
    "rejects credentials in %s",
    (raw) => {
      expect(() => assertSafeUrl(new URL(raw))).toThrow(/username or password/i);
    },
  );

  it("rejects non-http schemes", () => {
    expect(() => assertSafeUrl(new URL("ftp://example.com/"))).toThrow(/http and https/i);
    expect(() => assertSafeUrl(new URL("file:///etc/passwd"))).toThrow(/http and https/i);
  });

  it.each(["https://example.com/", "http://example.com:80/", "https://example.com:443/path?q=1", "http://8.8.8.8/"])(
    "allows %s",
    (raw) => {
      expect(() => assertSafeUrl(new URL(raw))).not.toThrow();
    },
  );
});

describe("createSafeLookup (DNS rebinding guard)", () => {
  const fakeDns =
    (answers: LookupAddress[]) =>
    (_host: string, _opts: unknown, cb: (err: NodeJS.ErrnoException | null, a: LookupAddress[]) => void) =>
      cb(null, answers);

  const run = (answers: LookupAddress[], all: boolean) =>
    new Promise<{ err: NodeJS.ErrnoException | null; result: unknown }>((resolve) => {
      createSafeLookup(fakeDns(answers))("example.com", { all }, (err, address, family) =>
        resolve({ err, result: all ? address : { address, family } }),
      );
    });

  it("hands the socket the vetted public address", async () => {
    const { err, result } = await run([{ address: "93.184.215.14", family: 4 }], false);
    expect(err).toBeNull();
    expect(result).toEqual({ address: "93.184.215.14", family: 4 });
  });

  it("supports all:true (used by Happy Eyeballs connection racing)", async () => {
    const answers = [
      { address: "93.184.215.14", family: 4 },
      { address: "2606:2800:21f:cb07:6820:80da:af6b:8b2c", family: 6 },
    ];
    const { err, result } = await run(answers, true);
    expect(err).toBeNull();
    expect(result).toEqual(answers);
  });

  it("refuses to connect when DNS answers with a private address", async () => {
    const { err } = await run([{ address: "127.0.0.1", family: 4 }], false);
    expect(err?.code).toBe("EBLOCKED");
  });

  it("refuses when any answer is private, even mixed with public ones", async () => {
    const { err } = await run(
      [
        { address: "93.184.215.14", family: 4 },
        { address: "::ffff:a9fe:a9fe", family: 6 },
      ],
      true,
    );
    expect(err?.code).toBe("EBLOCKED");
  });
});
