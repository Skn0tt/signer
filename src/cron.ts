import * as config from "./config";
import * as secrets from "./secrets";

const { ROTATION_INTERVAL } = config.get();

export const start = () => {
  setInterval(secrets.rotate, ROTATION_INTERVAL * 1000);
}
