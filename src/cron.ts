import * as config from "./config";
import * as secrets from "./secrets";

const { ROTATION_PERIOD } = config.get();

export const start = () => {
  setInterval(secrets.rotate, ROTATION_PERIOD * 1000);
}
