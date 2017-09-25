module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-phantomjs-launcher')
    ],
    port: 9876,
    colors: true,
    browsers: ['PhantomJS']
  });
};