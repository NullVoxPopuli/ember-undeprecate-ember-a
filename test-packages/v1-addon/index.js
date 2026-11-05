'use strict';

module.exports = {
  name: require('./package').name,

  options: {
    babel: {
      plugins: [
        require.resolve('ember-undeprecate-ember-a/babel-plugin'),
      ],
    },
  },
};
