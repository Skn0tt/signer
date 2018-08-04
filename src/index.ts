import * as rest from "./rest";
import * as config from "./config";
import * as cron from "./cron";
import * as redis from "./redis";
import * as secrets from "./secrets";

const init = async () => {
  config.validate();
  rest.start();
  redis.connect();

  const { DISABLE_ROTATING, ROTATE_ON_STARTUP } = config.get();
  if (!DISABLE_ROTATING) {
    cron.start();
  }
  if (ROTATE_ON_STARTUP) {
    await secrets.rotate();
  }
}

init();
