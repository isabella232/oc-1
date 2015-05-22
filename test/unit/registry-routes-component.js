'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');

describe('registry : routes : component', function(){

  var ComponentRoute = require('../../registry/routes/component'),
      mockedRepository, resJsonStub, componentRoute;
  
  var initialise = function(params){
    resJsonStub = sinon.stub();
    mockedRepository = {
      getCompiledView: sinon.stub().yields(null, params.view),
      getComponent: sinon.stub().yields(null, params.component),
      getDataProvider: sinon.stub().yields(null, params.data),
      getStaticFilePath: sinon.mock().returns('//my-cdn.com/files/')
    };
  };

  describe('when getting a component that implements a plugin', function(){

    describe('when plugin not declared in package.json', function(){

      before(function(){
        initialise({
          component: {
            name: 'plugin-component',
            version: '1.0.0',
            oc: {
              container: false,
              files: {
                template: {
                  type: 'jade',
                  hashKey: '8b3650989d66345eea8152e89ec03e1dad8e8e9b',
                  src: 'template.js'
                },
                dataProvider: {
                  type: 'node.js',
                  haskey: '6b28f479ae521755c9a4a9ecdd6e552b1e70892d',
                  src: 'server.js'
                }
              }
            },
          },
          data: '"use strict";module.exports.data=function(t,n){n(null,{a:t.plugins.doSomething()})};',
          view: 'var oc=oc||{};oc.components=oc.components||{},oc.components["8b3650989d66345eea8152e89ec03e1dad8e8e9b"]' +
                '=function(e){var n,o=[],c=e||{};return function(e){o.push("<div>"+jade.escape(null==(n=e)?"":n)+" John  </div>")}.' +
                'call(this,"a"in c?c.a:"undefined"!=typeof a?a:void 0),o.join("")};'
        });

        componentRoute = new ComponentRoute({}, mockedRepository);

        componentRoute({
          headers: {},
          params: { componentName: 'plugin-component' }
        }, {
          conf: {
            baseUrl: 'http://components.com/',
            plugins: {}
          },
          json: resJsonStub
        });
      });

      it('should return 501 status code', function(){
        expect(resJsonStub.args[0][0]).to.be.equal(501);
      });

      it('should respond with PLUGIN_MISSING_FROM_COMPONENT error code', function(){
        expect(resJsonStub.args[0][1].code).to.equal('PLUGIN_MISSING_FROM_COMPONENT');
      });

      it('should respond with error message including missing plugin', function(){
        expect(resJsonStub.args[0][1].error).to.equal('Component is trying to use un-registered plugins: doSomething');
      });
    });

    describe('when plugin declared in package.json', function(){

      beforeEach(function(){
        initialise({
          component: {
            name: 'plugin-component',
            version: '1.0.0',
            oc: {
              container: false,
              files: {
                template: {
                  type: 'jade',
                  hashKey: '8b3650989d66345eea8152e89ec03e1dad8e8e9b',
                  src: 'template.js'
                },
                dataProvider: {
                  type: 'node.js',
                  haskey: '6b28f479ae521755c9a4a9ecdd6e552b1e70892d',
                  src: 'server.js'
                }
              },
              plugins: ['doSomething']
            },
          },
          data: '"use strict";module.exports.data=function(t,n){n(null,{a:t.plugins.doSomething()})};',
          view: 'var oc=oc||{};oc.components=oc.components||{},oc.components["8b3650989d66345eea8152e89ec03e1dad8e8e9b"]' +
                '=function(e){var n,o=[],c=e||{};return function(e){o.push("<div>"+jade.escape(null==(n=e)?"":n)+" John  </div>")}.' +
                'call(this,"a"in c?c.a:"undefined"!=typeof a?a:void 0),o.join("")};'
        });

        componentRoute = new ComponentRoute({}, mockedRepository);
      });

      describe('when registry implements plugin', function(){

        beforeEach(function(){
          componentRoute({
            headers: {},
            params: { componentName: 'plugin-component' }
          }, {
            conf: {
              baseUrl: 'http://components.com/',
              plugins: {
                doSomething: function(){ return 'hello hello hello my friend'; }
              }
            },
            json: resJsonStub
          });
        });

        it('should return 200 status code', function(){
          expect(resJsonStub.args[0][0]).to.be.equal(200);
        });

        it('should use plugin inside compiledView', function(){
          expect(resJsonStub.args[0][1].html).to.contain('hello hello hello my friend John');
        });
      });

      describe('when registry does not implement plugin', function(){

        beforeEach(function(){
          componentRoute({
            headers: {},
            params: { componentName: 'plugin-component' }
          }, {
            conf: { baseUrl: 'http://components.com/' },
            json: resJsonStub
          });
        });

        it('should return 501 status code', function(){
          expect(resJsonStub.args[0][0]).to.be.equal(501);
        });

        it('should respond with PLUGIN_MISSING_FROM_REGISTRY error code', function(){
          expect(resJsonStub.args[0][1].code).to.equal('PLUGIN_MISSING_FROM_REGISTRY');
        });

        it('should respond with error message including missing plugin', function(){
          expect(resJsonStub.args[0][1].error).to.equal('registry does not implement plugins: doSomething');
        });
      });
    });
  });

  describe('when getting a component that requires a npm module', function(){

    describe('when registry implements dependency', function(){

      beforeEach(function(){
        initialise({
          component: {
            name: 'npm-component',
            version: '1.0.0',
            dependencies: {
              underscore: ''
            },
            oc: {
              container: false,
              files: {
                template: {
                  type: 'jade',
                  hashKey: '8b3650989d66345eea8152e89ec03e1dad8e8e9b',
                  src: 'template.js'
                },
                dataProvider: {
                  type: 'node.js',
                  haskey: '6a448d319fd64f46c6cdbad675f9eef09dde2d1b',
                  src: 'server.js'
                }
              }
            },
          },
          data: '"use strict";var _=require("underscore");module.exports.data=function(e,r){r(null,{a:_.first(["bye","welcome"])})};',
          view: 'var oc=oc||{};oc.components=oc.components||{},oc.components["8b3650989d66345eea8152e89ec03e1dad8e8e9b"]' +
                '=function(e){var n,o=[],c=e||{};return function(e){o.push("<div>"+jade.escape(null==(n=e)?"":n)+" John  </div>")}.' +
                'call(this,"a"in c?c.a:"undefined"!=typeof a?a:void 0),o.join("")};'
        });

        componentRoute = new ComponentRoute({}, mockedRepository);

        componentRoute({
          headers: {},
          params: { componentName: 'npm-component' }
        }, {
          conf: {
            local: true, //needed to invalidate the cache
            baseUrl: 'http://components.com/',
            plugins: {},
            dependencies: {
              underscore: require('underscore')
            }
          },
          json: resJsonStub
        });
      });
  
      it('should return 200 status code', function(){
        expect(resJsonStub.args[0][0]).to.be.equal(200);
      });

      it('should use plugin inside compiledView', function(){
        expect(resJsonStub.args[0][1].html).to.contain('bye John');
      });
    });

    describe('when registry does not implement dependency', function(){

      beforeEach(function(){
        initialise({
          component: {
            name: 'npm-component',
            version: '1.0.0',
            dependencies: {
              underscore: ''
            },
            oc: {
              container: false,
              files: {
                template: {
                  type: 'jade',
                  hashKey: '8b3650989d66345eea8152e89ec03e1dad8e8e9b',
                  src: 'template.js'
                },
                dataProvider: {
                  type: 'node.js',
                  haskey: '6a448d319fd64f46c6cdbad675f9eef09dde2d1b',
                  src: 'server.js'
                }
              }
            },
          },
          data: '"use strict";var _=require("underscore");module.exports.data=function(e,r){r(null,{a:_.first(["bye","welcome"])})};',
          view: 'var oc=oc||{};oc.components=oc.components||{},oc.components["8b3650989d66345eea8152e89ec03e1dad8e8e9b"]' +
                '=function(e){var n,o=[],c=e||{};return function(e){o.push("<div>"+jade.escape(null==(n=e)?"":n)+" John  </div>")}.' +
                'call(this,"a"in c?c.a:"undefined"!=typeof a?a:void 0),o.join("")};'
        });

        componentRoute = new ComponentRoute({}, mockedRepository);

        componentRoute({
          headers: {},
          params: { componentName: 'npm-component' }
        }, {
          conf: {
            local: true, //needed to invalidate the cache
            baseUrl: 'http://components.com/',
            plugins: {},
            dependencies: {}
          },
          json: resJsonStub
        });
      });

      it('should return 501 status code', function(){
        expect(resJsonStub.args[0][0]).to.be.equal(501);
      });

      it('should respond with DEPENDENCY_MISSING_FROM_REGISTRY error code', function(){
        expect(resJsonStub.args[0][1].code).to.equal('DEPENDENCY_MISSING_FROM_REGISTRY');
      });

      it('should respond with error message including missing dependency', function(){
        expect(resJsonStub.args[0][1].error).to.equal('Component is trying to use unavailable dependencies: underscore');
      });
    });
  });
});