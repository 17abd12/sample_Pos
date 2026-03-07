import { SignJWT, jwtVerify } from "jose";


const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signJwt(payload: Record<string, unknown>, expiresIn = "6h") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}
