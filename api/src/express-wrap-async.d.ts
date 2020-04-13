declare module "express-wrap-async" {
  import { Request, Response, RequestHandler } from "express";

  export default function wrapAsync(r: (req: Request, res: Response) => Promise<any>): RequestHandler;
}