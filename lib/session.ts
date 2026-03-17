import { createHmac, timingSafeEqual } from "crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET ?? "dev-only-change-this-session-secret";

export type SessionUser = {
  id: number;
  ime: string;
  priimek: string;
  eposta: string;
};

type SessionPayload = SessionUser & {
  exp: number;
};

const toBase64Url = (value: string) =>
  Buffer.from(value, "utf8").toString("base64url");

const fromBase64Url = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const sign = (value: string) =>
  createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");

export const createSessionToken = (user: SessionUser) => {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadEncoded);

  return `${payloadEncoded}.${signature}`;
};

export const verifySessionToken = (token: string | undefined) => {
  if (!token) {
    return null;
  }

  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    return null;
  }

  const expectedSignature = sign(payloadEncoded);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadEncoded)) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      ime: payload.ime,
      priimek: payload.priimek,
      eposta: payload.eposta,
    } satisfies SessionUser;
  } catch {
    return null;
  }
};

export const sessionMaxAge = SESSION_TTL_SECONDS;
