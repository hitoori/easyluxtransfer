export const MAX_REQUEST_BYTES = 24000;

export class RequestTooLarge extends Error {}

// Works with Web ReadableStream and Node's async-iterable IncomingMessage.
// Stop accumulation before decoding or JSON parsing, including chunked bodies.
export async function readLimitedBody(stream, limit = MAX_REQUEST_BYTES) {
  const chunks = [];
  let bytes = 0;
  const input = typeof stream?.iterator === "function" ? stream.iterator({ destroyOnReturn: false }) : stream;
  if (input) for await (const chunk of input) {
    const value = typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk;
    bytes += value.byteLength;
    if (bytes > limit) throw new RequestTooLarge("Request too large.");
    chunks.push(value);
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}
