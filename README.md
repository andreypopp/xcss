# xcss

CSS bundler with the following features:

  * Dependency resolution using Node module resolution algorithm.
  * Stylesheet AST transformations in spirit of rework.
  * Source maps support.
  * Elimination of unused class rules.
  * Class name compression.

It is like [browserify][1] but for CSS.

[1]: http://browserify.org

## Installation

    % npm install xcss

## Basic usage

xcss can be used as a command-line utility:

    Usage: xcss [options] entry

    Options:
      -h, --help       Show this message and exit
      -v, --version    Print xcss version and exit
      -d, --debug      Emit source maps
      -c, --compress   Compress output
      --class-map      Use class map to remove unused stylesheet rules
      -t, --transform  Apply transform

## API

Usage from Node.js is pretty simple:

    var xcss = require('xcss');

    var bundle = xcss({
      transform: ['xcss/transforms/vars'],
      classMap: {
        '.theOnlyUsedClassName': true
      },
      debug: true // generate source map
    });

    bundle.pipe(process.stdout);

## Dependency resolution

xcss uses Node module resolution strategy to resolve dependencies of each
concrete CSS module. To import other modules a inside package you should use
relative identifier like `./dep` or `./lib/dep`. To import stylesheets from
other packages in `node_modules/` directory you should use just package
identifier `pkg` and if you want a submodule in a package — `pkg/submodule`.

As a package author you can customize an entry point to you package by providing
a `"style"` property in `package.json`. If you `"style"` property is set to
`"./lib/styles.css"` like so:

    {
      ...
      "name": "pkg",
      "style": "./lib/styles.css",
      ...
    }

then a user of your package will get `pkg/lib/style` when importing `pkg`.

## Transforms

xcss comes bundled with three transform — `extend`, `vars` and `autoprefixer`
which are all based on corresponding transforms for rework — `rework-inherit`,
`rework-vars` and `autoprefixer`.

You can use transforms by using a `--transform` option:

    xcss -t xcss/transforms/vars -t xcss/transforms/extend ./main.css

As you can see, xcss supports rework transforms but have slightly different
configuration for them which allows using them from command line. Each transform
resides in its own module and should require no configuration (that means having
a set of sensible defaults).

Usually that means that using rework transforms are super easy, for example to
create a xcss transform from `rework-vars` you just create a module with the
following contents:

    var vars = require('rework-vars);

    module.exports = function(style, ctx) {
      return vars(ctx.vars)(style.stylesheet);
    }

## Elimination of unused class rules

To remove unused stylesheet rules you should pass a class map file via
`--class-map` option. Class map file is a JSON file formatted like
`{".class-name": true}`.

You can use `xcss-classmap` command line utility to build one from JavaScript
code:

    Usage: xcss-classmap [options] entry ...

    Options:
      -h, --help      Show this message and exit
      -v, --version   Print xcss version and exit

It extracts class names marked with `cx()` function calls, for example the
following code:

    var classString = cx('.some-class', '.another-class');

would result in a class map:

    {
      ".some-class": true,
      ".another-class": true
    }

At runtime `classString` will be equal to `.some-class .another-class` so you
can use it to insert `class` attribute in a DOM.

Another way to call `cx()` function it to pass an object literal with class
names as keys and boolean expressions as values:

    var classString = cx({
      '.some-class': true,
      '.another-class': someCondition()
    });

That way at runtime `classString` will be evaluated so that it only contains
class names those values evaluated to `true`.

In CommonJS environment you can obtain `cx()` function in module `xcss/cx`.

## Class name compression

Class map passed as `--class-map` option can have string as values, which will
be used to replace class names. That means you can generate class map from you
codebase which will shorten class names.
