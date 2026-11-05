import './deprecation-guard';
import '@warp-drive/ember/install';
import Application from 'ember-cli-app-with-v1-addon/app';
import config from 'ember-cli-app-with-v1-addon/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { loadTests } from 'ember-qunit/test-loader';
import { start, setupEmberOnerrorValidation } from 'ember-qunit';

setApplication(Application.create(config.APP));

setup(QUnit.assert);
setupEmberOnerrorValidation();
loadTests();
start();
