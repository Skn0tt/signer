import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import wrapAsync from 'express-wrap-async';
import bodyParser from "body-parser";
import Signer from "../lib";
import * as redis from "redis";
import * as config from "./config";

const app = express();

const mrgnFormat = ':remote-addr - :remote-user [:date[clf]] ":method :sanitizedUrl HTTP/:http-version" :status :res[content-length]'

app.use(morgan(morgan.compile(mrgnFormat)));

morgan.token('sanitizedUrl', req => req.url.includes("/tokens") ? "/tokens/***" : req.url)

const { REDIS_HOSTNAME, REDIS_PORT, ASYMMETRIC_SIGNING, ROTATION_INTERVAL, SECRET_LENGTH, TOKEN_EXPIRY, ROTATE_ON_STARTUP } = config.get();

const redisClient = redis.createClient(`redis://${REDIS_HOSTNAME}:${REDIS_PORT}`);

const signer = await Signer.fromRedis(
  redisClient,
  {
    mode: ASYMMETRIC_SIGNING ? "asymmetric" : "symmetric",
    rotationInterval: ROTATION_INTERVAL,
    secretLength: SECRET_LENGTH,
    tokenExpiry: TOKEN_EXPIRY
  }
);
const jwtRepo = signer.getJwtRepository();

// GET Secrets
app.get(
  "/secrets",
  wrapAsync(async (_, res) => {
    const result = await signer.getPublic();

    return res
            .status(200)
            .json(result)
            .end();
  }
));

app.get(
  "/secrets/old",
  wrapAsync(async (_, res) => {
    const { old } = await signer.getPublic();

    return res
            .status(200)
            .send(old)
            .end();
  })
);

app.get(
  "/secrets/current",
  wrapAsync(async (_, res) => {
    const { current } = await signer.getPublic();

    return res
            .status(200)
            .send(current)
            .end();
  })
);

app.post(
  "/secrets",
  wrapAsync(async (_, res) => {
    await signer.rotate();

    return res
            .status(200)
            .end();
  }
));

// Verify Token
app.get(
  "/tokens/:token",
  wrapAsync(async (req, res) => {
    const { token } = req.params;
    const payload = await jwtRepo.verify(token);
    
    if (payload) {
      return res
              .status(200)
              .json(payload);
    } else {
      return res
              .status(401)
              .end();
    }
  }
));

app.head(
  "/tokens/:token",
  wrapAsync(async (req, res) => {
    const { token } = req.params;
    const payload = await jwtRepo.verify(token);

    return res
            .status(!!payload ? 200 : 401)
            .end();
    }
));

// Sign body with secrets
app.post(
  "/tokens",
  bodyParser.json({ strict: true }),
  wrapAsync(async (req, res) => {
    const { body } = req;
    const signedJwt = await jwtRepo.sign(body);

    return res
            .status(201)
            .send(signedJwt);
  }
));

app.delete(
  "/tokens/:token",
  wrapAsync(async (req, res) => {
    const { token } = req.params;
    await jwtRepo.block(token);

    return res
            .status(200)
            .end();
  }
))

function isRedisHealthy() {
  return new Promise<boolean>(resolve => {
    redisClient.ping((err) => {
      if (!err) {
        resolve(true);
      }
    })

    setTimeout(
      () => resolve(false),
      1000
    );
  })
}

async function createHealthReport() {
  const redisIsHealthy = await isRedisHealthy();
    
  const signerIsHealthy = redisIsHealthy;

  return {
    isHealthy: signerIsHealthy,
    dependencies: {
      redis: redisIsHealthy
    }
  };
}

app.get(
  "/status",
  wrapAsync(async (_, res) => {
    const healthReport = await createHealthReport();

    return res
            .status(healthReport.isHealthy ? 200 : 503)
            .json(healthReport)
            .end();
  })
);

app.use(
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    return res
            .status(500)
            .json({
              error: err.message,
            });
  }
);

app.listen(3000);
if (ROTATE_ON_STARTUP) {
  await signer.rotate();
}
