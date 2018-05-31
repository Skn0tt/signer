import express, { RequestHandler, Request, Response, NextFunction } from "express";
import morgan from "morgan";
import * as secrets from "./secrets";
import * as config from "./config";
import wrapAsync from 'express-wrap-async';

const app = express();

app.use(morgan('common'))

app.get("/secrets", wrapAsync(async (req: Request, res: Response) => {
  const result = await secrets.get();

  return res
    .status(200)
    .send(result)
    .end();
}))

app.post("/rotate", wrapAsync(async (req: Request, res: Response) => {
  const result = await secrets.rotate();

  return res
    .status(200)
    .end();
}));

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log({
    err, req, res
  })
  return res
    .status(500)
    .json({
      error: err.message,
    });
});

export const start = () => {
  app.listen(config.get().PORT);
}
