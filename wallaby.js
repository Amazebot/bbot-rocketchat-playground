module.exports = function (wallaby) {
  return {
    name: 'faldo',
    files: [
      './*.js',
      { pattern: './*.spec.js', ignore: true }
    ],
    tests: ['./*.spec.js'],
    testFramework: 'mocha',
    env: {
      type: 'node'
    },
    debug: true,
    slowTestThreshold: 200,
    delays: {
      run: 2500
    }
  }
}
