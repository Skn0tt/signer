import * as rest from "./rest";
import * as config from "./config";
import * as cron from "./cron";
import * as redis from "./redis";

const init = () => {
  config.validate();
  rest.start();
  redis.connect();

  if (!config.get().DISABLE_ROTATING) {
    cron.start();
  }
}

init();
