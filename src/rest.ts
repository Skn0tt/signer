import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import * as secrets from "./secrets";
import * as jwt from "./jwt";
import wrapAsync from 'express-wrap-async';
import bodyParser from "body-parser";
import { resolve } from "path";

const app = express();

const mrgnFormat = ':remote-addr - :remote-user [:date[clf]] ":method :sanitizedUrl HTTP/:http-version" :status :res[content-length]'

app.use(morgan(morgan.compile(mrgnFormat)));

morgan.token('sanitizedUrl', req => req.url.includes("/tokens") ? "/tokens/***" : req.url)

// GET Secrets
app.get(
  "/secrets",
  wrapAsync(async (_, res) => {
    const result = await secrets.getPublic();

    return res
            .status(200)
            .json(result)
            .end();
  }
));

app.get(
  "/secrets/old",
  wrapAsync(async (_, res) => {
    const result = await secrets.getOldPublic();

    return res
            .status(200)
            .send(result)
            .end();
  })
);

app.get(
  "/secrets/current",
  wrapAsync(async (_, res) => {
    const result = await secrets.getCurrentPublic();

    return res
            .status(200)
            .send(result)
            .end();
  })
);

app.post(
  "/secrets",
  wrapAsync(async (_, res) => {
    await secrets.rotate();

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
    const [ correct, payload ] = await jwt.verify(token);
    
    if (correct) {
      return res
              .status(200)
              .json(payload);
    } else {
      return res
              .status(401)
              .send(payload);
    }
  }
));

app.head(
  "/tokens/:token",
  wrapAsync(async (req, res) => {
    const { token } = req.params;
    const [ correct ] = await jwt.verify(token);

    return res
            .status(correct ? 200 : 401)
            .end();
    }
));

// Sign body with secrets
app.post(
  "/tokens",
  bodyParser.json({ strict: true }),
  wrapAsync(async (req, res) => {
    const { body } = req;
    const signedJwt = await jwt.sign(body);

    return res
            .status(201)
            .send(signedJwt);
  }
));

app.delete(
  "/tokens/:token",
  wrapAsync(async (req, res) => {
    const { token } = req.params;
    await jwt.block(token);

    return res
            .status(200)
            .end();
  }
))

app.get("/status", (_, res) => res.status(200).end());

app.use(
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    return res
            .status(500)
            .json({
              error: err.message,
            });
  }
);

export const start = () => {
  app.listen(3000);
}
