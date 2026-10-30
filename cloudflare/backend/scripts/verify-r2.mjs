import { createHash, createHmac } from "node:crypto";

// Read-only SigV4 ListBuckets check. Never upload, remove or print object names.
try {
  const { R2_ACCOUNT_ID: account, R2_ACCESS_KEY_ID: key, R2_SECRET_ACCESS_KEY: secret, R2_ENDPOINT: endpointValue } = process.env;
  if (!account || !key || !secret || !endpointValue) throw new Error("R2 credentials are incomplete.");
  const endpoint = new URL(endpointValue);
  if (endpoint.protocol !== "https:" || endpoint.host !== `${account}.r2.cloudflarestorage.com` || endpoint.pathname !== "/" || endpoint.search) {
    throw new Error("R2 endpoint/account mismatch.");
  }
  const hash = (value) => createHash("sha256").update(value).digest("hex");
  const hmac = (keyValue, value) => createHmac("sha256", keyValue).update(value).digest();
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = timestamp.slice(0, 8);
  const scope = `${date}/auto/s3/aws4_request`;
  const payloadHash = hash("");
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = `host:${endpoint.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timestamp}\n`;
  const canonical = ["GET", "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secret}`, date), "auto"), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(`AWS4-HMAC-SHA256\n${timestamp}\n${scope}\n${hash(canonical)}`).digest("hex");
  const response = await fetch(endpoint, {
    headers: {
      "x-amz-content-sha256": payloadHash, "x-amz-date": timestamp,
      Authorization: `AWS4-HMAC-SHA256 Credential=${key}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const body = await response.text();
    const code = body.match(/<Code>([A-Za-z0-9]+)<\/Code>/)?.[1] || "unavailable";
    throw new Error(`R2 read-only check failed (HTTP ${response.status}, ${code}). Bucket-scoped credentials may not allow listing buckets.`);
  }
  await response.body?.cancel();
  console.log("R2 S3 read-only credential check passed. No buckets or objects were changed.");
} catch (error) {
  const causeCode = error?.cause?.code;
  console.error(error instanceof Error && error.message.startsWith("R2 ") ? error.message : `R2 verification failed (${typeof causeCode === "string" && /^[A-Z0-9_/]+$/.test(causeCode) ? causeCode : "network error"}). Check R2 activation and connectivity.`);
  process.exitCode = 1;
}
