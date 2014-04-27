# IMPORTANT: This module is under development.

# Configurant

> Environment-specific configuration management.

With support for inheritance through files, environment variables, command-line arguments or custom sources.

## Usage

    var configurant = require('configurant');

    var config = configurant({
        env: 'development',
        path: './config'
    });

    // After Configurant has been initialized, you can subsequently access the
    // configuration object directly without having to initialize Configurant again:
    var config = configurant();


## Options

* `env` string (Default: `null`; Example: `development`) ... Environment to load config files from.
* `path` string (Default: `./config`; Example: `./app/config`) ... Path to your config folder. Relative to the current working directory of the process `process.cwd()`.
* `namespace` boolean (Default: `false`) ... Whether or not to namespace config files based on their filenames. This lets you split your configuration into multiple files, such as `db.json` and have it under the namespace `db`.
* `sources` array (Default: `['file']`; Example: `['file', 'env', 'argv']`) ... The sources and their order in which they are merged in.

You can also use environment variables or command-line arguments to set-up Configurant. In that case, the merge order is independent from what's specified in `sources` and works as follows: env > options > argv.


## Sources

Configurant comes with support for three standard types of configuration sources: files, environment variables and command-line arguments:

### File

Loads and merges configuration files from the folder specified by `path`.

You can either use JSON files to store your configuration, or regular JS files where you export an object:

    // config.json
    {
        "name": "My App",
        "port": 3000
    }

    // config.js
    module.exports = {
        name: 'My App',
        port: 3000
    };

An example structure might look as follows:

    /config
      /development
        config.json
      config.json
    app.js
    package.json

Please note that sub-folders are only supported for environment-specific configuration and not for general file organization.

### Env

Loads and merges environment variables from `process.env`:

    setenv NAME = "My App"

Environment variables are uppercase by convention, but can be lowercase as well.

You can use the dot `.` to namespace and nest into an existing object:

    setenv db.host = "localhost"

Please note that you need to set your environment variables prior to initializing Configurant.

### Argv

Loads and merges command-line arguments from `process.argv`.

    node app.js -name = "My App"

You can as well use the dot `.` to namespace.

    node app.js -db.host = "localhost"


## TODO

### Milestone 0.1.0

* Add source options such as `env.only` (to limit to specific variables) or `env.separator` (to specify a custom namespace separator).
* Support for custom sources. `configurant.addSource('name', function () { /*...*/ })`
* Find a way to test argv.
* Make sure argv (and env) numbers work correctly (and not as strings).
* Support arrays and objects as JSON strings for argv and env.
* Replace Lodash's merge() with something more performant. For example jQuery's deep extend is a lot faster.