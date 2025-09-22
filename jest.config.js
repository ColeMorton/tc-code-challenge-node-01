// Main Jest configuration that delegates to separate working configs
module.exports = {
  projects: [
    './jest.frontend.config.js',
    './jest.api.config.js'
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
}