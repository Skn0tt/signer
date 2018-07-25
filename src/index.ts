import * as rest from "./rest";
import * as config from "./config";
import * as cron from "./cron";

const init = () => {
  config.validate();
  rest.start();

  if (!config.get().DISABLE_ROTATING) {
    cron.start();
  }
}

init();
