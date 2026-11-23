import cors from "cors";
import express, { type Request, type Response, type NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = Number(process.env.PORT || 3000);

const ISSUER =
  process.env.KEYCLOAK_ISSUER ||
  "http://localhost:8081/realms/platform";

const JWKS_URL =
  process.env.KEYCLOAK_JWKS_URL ||
  `${ISSUER}/protocol/openid-connect/certs`;

const AUDIENCE = "platform-backend";

const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

app.use(cors({ origin: "http://localhost:8080" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "platform-backend",
  });
});

async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const token = authorization.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["RS256"],
    });

    res.locals.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.get("/profile", authenticate, (_req, res) => {
  const user = res.locals.user;

  res.json({
    message: "Protected API accessed successfully",
    userId: user.sub,
    username: user.preferred_username,
    audience: user.aud,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});