export default {
  scenarios: [
    {
      name: 'ember-lts-5.12',
      npm: { devDependencies: { 'ember-source': '~5.12.0' } },
    },
    {
      name: 'ember-lts-6.4',
      npm: { devDependencies: { 'ember-source': '~6.4.0' } },
    },
    {
      name: 'ember-lts-6.12',
      npm: { devDependencies: { 'ember-source': '~6.12.0' } },
    },
    {
      name: 'ember-latest',
      npm: { devDependencies: { 'ember-source': 'latest' } },
    },
    {
      name: 'ember-beta',
      npm: { devDependencies: { 'ember-source': 'beta' } },
    },
    {
      name: 'ember-alpha',
      npm: { devDependencies: { 'ember-source': 'alpha' } },
    },
  ],
};
