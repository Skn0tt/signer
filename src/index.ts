import * as rest from "./rest";
import * as config from "./config";
import * as cron from "./cron";

const init = () => {
  config.validate();
  cron.start();
  rest.start();
}

init();
