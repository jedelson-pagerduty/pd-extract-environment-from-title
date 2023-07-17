async function createSignature(payload: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const secret = encoder.encode(key);
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", hmacKey, data);
  const hexSignature = [...new Uint8Array(signature)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hexSignature;
}

export default {
  async verifySignature(
    payload: string,
    key: string,
    headers: Headers,
  ): Promise<boolean> {
    const signatures = headers.get("x-pagerduty-signature");
    if (!signatures) {
      console.log("request did not contain x-pagerduty-signature header");
      return false;
    }
    const signature = await createSignature(payload, key);
    const signatureWithVersion = `v1=${signature}`;

    console.log(`expected signature: ${signature}`);

    return signatures.split(",").includes(signatureWithVersion);
  },
};
