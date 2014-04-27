var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var minimist = require('minimist');

/**
 * Composed config object.
 *
 * @namespace
 */
var config = null;

/**
 * Composed module options.
 *
 * @namespace
 */
var options = {};

/**
 * Default module options.
 *
 * TODO: Merge with options?
 *
 * @namespace
 */
var defaults = {
    env:  null,
    path: './config',
    namespace: false,
    sources: ['file']
};

/**
 * Generate absolute path.
 *
 * @param {String} configPath - Relative path to config dir.
 * @returns {String} - Absolute path to config dir.
 */
function generatePath(configPath) {
    return path.join(process.cwd(), path.normalize(configPath));
}

/**
 * Merge recursively.
 *
 *
 *
 * @param [arguments] One or more objects to be merged. Subsequent objects will overwrite property assignments of previous objects.
 * @returns {Object}
 */
function merge() {
    // We need to turn arguments into a real array to unshift an empty array to its top.
    // This is because Lodash's merge method merges subsequent objects into the first object specified. However this
    // leads to all sorts of reference problem.
    var args = Array.prototype.slice.call(arguments);
    args.unshift({});

    return _.merge.apply(null, args);
}

/**
 * Checks if key is a namespace.
 *
 * @param {String} key - E.g. `db.host`
 * @returns {boolean} - Whether the key is a namespace or not.
 */
function isNested(key) {
    return key.indexOf('.') > 0;
}

/**
 * Get object from namespace.
 *
 * @param {String} namespace - Namespaced property key.
 * @param {String} value - Property value.
 * @returns {Object}
 */
function getNested(namespace, value) {
    var parts = namespace.split('.');

    var object = parts.reduceRight(function (obj, part, index) {
        if (index === parts.length-1) {
            obj[part] = value;
            return obj;
        }

        var tmp = {};
        tmp[part] = obj;
        return tmp;
    }, {});

    return object;
}

/**
 * Sources namespace.
 *
 * Info: Sources only need to be methods of a object in order to use namespace[source].call().
 *
 * @namespace
 */
var sources = {
    /**
     * Source: file
     *
     * @returns {Object} - Composed file config object.
     */
    file: function () {

        /**
         * Read files in directory.
         *
         * TODO: Performance implication of multiple merge?
         *
         * @param {String} pathToDir - Absolute path to directory.
         * @returns {Array} - Array of filenames with extension of `.js` or `.json`.
         */
        var readFiles = function (pathToDir) {
            return fs.readdirSync(pathToDir).filter(function (filename) {
                return path.extname(filename) === '.js' || path.extname(filename) === '.json';
            });
        };

        /**
         * Read config file.
         *
         * @param {String} filename - Filename of the file to be read.
         * @returns {Object} - Configuration object, merged with environment if applicable.
         */
        var readFile = function (filename) {
            var fileConfig = require(path.join(options.path, filename));

            // Merge in environment-specific config.
            if (options.env) {
                var envFile = path.join(options.path, options.env, filename);
                if (fs.existsSync(envFile)) {
                    var envConfig = require(envFile);
                    merge(fileConfig, envConfig);
                }
            }

            // Add namespace (filename without extension) to config object.
            if (options.namespace) {
                var namespace = filename.slice(0, filename.lastIndexOf('.'));
                fileConfig = fileConfig[namespace] = fileConfig;
            }

            return fileConfig;
        };

        var files = readFiles(options.path);

        var sourceConfigs = files.map(function (filename) {
            return readFile(filename);
        });

        return merge.apply(null, sourceConfigs);
    },

    /**
     * Source: env
     *
     * Info: process.env forces all of its properties to be of type string.
     *
     * @returns {Object} - Composed env config object.
     */
    env: function () {
        // TODO: Only convert to real object when necessary (namespaced key is present).
        var envs = {};
        for (var env in process.env) {
            envs[env] = process.env[env];
        }

        // Nest namespaced env variables.
        // TODO: Optimize with Object.keys and while loop.
        for (var prop in envs) {
            if (envs.hasOwnProperty(prop) && isNested(prop)) {
                var nested = getNested(prop, envs[prop]);
                envs = merge(envs, nested);
                delete envs[prop];
            }
        }

        return envs;
    },

    /**
     * Source: argv
     *
     * @returns {Object} - Composed argv config object.
     */
    argv: function () {
        var argvs = minimist(process.argv.slice(2));

        // TODO: Dublicated code from env().
        // TODO: Make sure argvs has `hasOwnProperty` method.
        for (var prop in argvs) {
            if (argvs.hasOwnProperty(prop) && isNested(prop)) {
                var nested = getNested(prop, argvs[prop]);
                argvs = merge(argvs, nested);
                delete argvs[prop];
            }
        }

        return argvs;
    }
};

/**
 * Load sources in defined order.
 *
 * @returns {Array} - Array of source objects.
 */
function loadSources() {
    var sourceConfigs = [];

    // TODO: map()
    options.sources.forEach(function (source) {
        var sourceConfig = sources[source].call(this, []);
        sourceConfigs.push(sourceConfig);
    });

    return sourceConfigs;
}

/**
 * Compose config object from config sources.
 */
function composeConfig() {
    config = merge.apply(null, loadSources());
}

/**
 *
 * @param opts
 * @returns {{}}
 * @public
 */
module.exports = function configurant(opts) {
    _.merge(options, defaults, opts);

    if (options.path) {
        options.path = generatePath(options.path);
    }

    // Ensure path exists if source includes file.
    if (options.sources.indexOf('file') !== -1 && !fs.existsSync(options.path)) {
        throw new Error('Configurant: config path ' + options.path + ' not found.');
    }

    composeConfig();

    return config;
};

/**
 * Return module options.
 *
 * TODO: options can be modified (by reference), even though it's only a "getter".
 *
 * @returns {options}
 * @public
 */
module.exports.getOptions = function () {
    return options;
};

/**
 * Add custom source strategy.
 *
 * @public
 */
module.exports.addSource = function addSource() {
    // TODO: Implement
};

/**
 * Reset options and composed config object.
 *
 * @public
 */
module.exports.reset = function reset() {
    config = null;

    // TODO: That will probably create a reference between options and defaults and will overwrite defaults when options are modified(?).
    options = defaults;
};