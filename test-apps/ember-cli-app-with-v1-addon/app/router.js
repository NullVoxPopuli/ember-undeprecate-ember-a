import EmberRouter from '@ember/routing/router';
import config from 'ember-cli-app-with-v1-addon/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {});
