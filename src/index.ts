import * as rest from "./rest";
import * as config from "./config";
import * as secrets from "./secrets";
import * as cron from "./cron";

const init = () => {
  config.validate();
  secrets.rotate();
  cron.start();
  rest.start();
}

init();
