# xcss

CSS bundler with the following features:

  * Dependency resolution using Node module resolution algorithm.
  * Stylesheet AST transformations in spirit of rework.
  * Source maps support.
  * Elimination of unused class rules.

It is like [browserify][1] but for CSS.

[1]: http://browserify.org

## Installation

    % npm install xcss

## Usage

xcss can be used as a command-line utility:

    Usage: xcss [options] entry

    Options:
      -h, --help       Show this message and exit
      -v, --version    Print xcss version and exit
      -d, --debug      Emit source maps
      --class-map      Use class map to remove unused stylesheet rules
      -t, --transform  Apply transform

To remove unused stylesheet rules you should pass a class map file via
`--class-map` option. Class map file is a JSON file formatted like
`{"class-name": true}`.

You can use `xcss-classmap` command line utility to build one from JavaScript
code:

    Usage: xcss-classmap [options] entry ...

    Options:
      -h, --help      Show this message and exit
      -v, --version   Print xcss version and exit

It extracts class names marked with `cx()` function calls, for example the
following code:

    var classString = cx('some-class', 'another-class');

would result in a class map:

    {
      "some-class": true,
      "another-class": true
    }

At runtime `classString` will be equal to `.some-class .another-class` so you
can use it to insert `class` attribute in a DOM.

Another way to call `cx()` function it to pass an object literal with class
names as keys and boolean expressions as values:

    var classString = cx({
      'some-class': true,
      'another-class': someCondition()
    });

That way at runtime `classString` will be evaluated so that it only contains
class names those values evaluated to `true`.

In CommonJS environment you can obtain `cx()` function in module `xcss/cx`.
