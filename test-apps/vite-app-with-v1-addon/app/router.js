import EmberRouter from '@embroider/router';
import config from 'vite-app-with-v1-addon/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {});
