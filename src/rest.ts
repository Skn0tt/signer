import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import * as secrets from "./secrets";
import * as jwt from "./jwt";
import wrapAsync from 'express-wrap-async';
import bodyParser from "body-parser";

const app = express();

app.use(morgan('common'));

// GET Secrets
app.get(
  "/secrets",
  wrapAsync(async (_, res) => {
    const result = await secrets.get();

    return res
            .status(200)
            .json(result)
            .end();
  }
));

app.get(
  "/secrets/old",
  wrapAsync(async (_, res) => {
    const result = await secrets.getOld();

    return res
            .status(200)
            .send(result)
            .end();
  })
);

app.get(
  "/secrets/current",
  wrapAsync(async (_, res) => {
    const result = await secrets.getCurrent();

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
  "/secrets/:token",
  wrapAsync(async (req, res) => {
    const { token } = req.params;
    await jwt.block(token);
    return res
            .status(200)
            .end();
  }
))

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
