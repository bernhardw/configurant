var _ = require('lodash');
var should = require('should');
var assert = require('assert');

describe('Configurant:', function () {

    var configurant;

    beforeEach(function () {
        configurant = require('../lib');
    });

    describe('When required', function () {
        it('should return a function', function () {
            configurant.should.be.an.instanceof(Function);
        });
    });

    describe('When initialized', function () {
        it('should take options', function () {
            var options = {
                env: 'development',
                path: './test/data'
            };
            configurant(options);
            configurant.getOptions().env.should.equal('development');
            configurant.getOptions().should.have.property('path');
        });

        it('should have default options', function () {
            configurant({
                path: './test/data'
            });
            assert(configurant.getOptions().env === null);
            configurant.getOptions().sources.should.eql(['file']);
        });

        it('should throw an error when path does not exist but has file as source', function () {
            var configurant = require('../lib');
            (function () {
                configurant({ path: 'foo' });
            }).should.throw();
        });
    });

    describe('Sources:', function () {

        describe('File:', function () {
            it('should load files', function () {
                var result = _.merge(require('./data/a.js'), require('./data/b.json'));
                var configurant = require('../lib');
                var config = configurant({
                    path: './test/data',
                    sources: ['file']
                });
                config.should.eql(result);
            });
        });

        describe('Env:', function () {
            it('should load environment variables', function () {
                process.env.foo = 'bar';
                var config = configurant({
                    sources: ['env']
                });
                config.foo.should.equal('bar');
            });

            it('should load namespaced environment variables', function () {
                process.env['foo.bar'] = 'baz';
                var config = configurant({
                    sources: ['env']
                });
                config.foo.bar.should.equal('baz');
            });
        });

        describe('Argv:', function () {
            it('should merge command-line arguments', function () {
                var config = configurant({
                    sources: ['argv']
                });
                // TODO
            });
        });

        describe('Order:', function () {
            it('env should overwrite file', function () {
                process.env.name = 'Foo';
                var config = configurant({
                    path: './test/data',
                    sources: ['file', 'env']
                });
                config.name.should.equal('Foo');
            });

            it('file should overwrite env', function () {
                process.env.name = 'Foo';
                var config = configurant({
                    path: './test/data',
                    sources: ['env', 'file']
                });
                config.name.should.equal('My App');
            });
        });

    });

});