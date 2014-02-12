# xCSS

xCSS is a JavaScript library for programmatic stylesheet composition and a
syntax sugar on top of it.

The idea is to produce CSS by composing data structures in JavaScript. That way
you don't need preprocessors like Sass, Less or Stylus. Instead, all the power
of JavaScript is at your fingertips.

Moreover xCSS is based on Node.js and allows you to reuse its module system and
even package manager, [npm](http://npmjs.org) with thousands of packages there.

Writing CSS with JavaScript can be verbose. To fix that xCSS provides a compiler
from xCSS (a language, a superset of CSS) to JavaScript.

A xCSS module looks like:

    @import "./other-stylesheet.xcss";

    @require "some-pkg/theme" as theme;

    .Component {
      width: 12px;
      background-color: {theme.bgColor};
    }

It compiles into the following JavaScript module which is essentially a CommonJS
(Node.js) module which uses xCSS object model:

    var xcss = require("xcss"),
        theme = require("some-pkg/theme");

    module.exports = xcss.om.stylesheet(null,
      xcss.om.import(require("./other-stylesheet.xcss")),
      xcss.om.rule('.Component', {
        width: '12px',
        backgroundColor: theme.bgColor
      })
    );

Now to get the CSS string from that you just need to evaluate this module in
Node, the module's value is a `xcss.Stylesheet` object which has `.toCSS()`
method.

## Installation

Install via npm:

    % npm install --global xcss

## Using from command-line

After installation there's `xcss` command line utility, which generates a CSS
from a given xCSS module:

    % xcss ./index.xcss > bundle.css

Run `xcss --help` to see more options:

    Usage: xcss [options] <filename>

    Compile xCSS to CSS and print the result.

    Options:

        -c, --compress  Compress the resulted stylesheet

        --object-model  Print the result of translation from xCSS to JavaScript

            -h, --help  Show this message and exit

## Using from Node.js

xCSS modules are just Node modules but expressed in a different syntax. That
basically means that you'll be able to require xCSS modules directly:


    // this line is needed to install .xcss handle
    require('xcss');

    // require .xcss directly!
    var stylesheet = require('./index.xcss');

    // generate CSS and print it
    console.log(stylesheet.toCSS());

You can transform stylesheets in any way you want, for example, combine two
stylsheets together:

    var button = require('./button.xcss');
    var select = require('./select.xcss');

    console.log(button.concat(select));

## Using as a browserify plugin

Since 3.28.0 version browserify has a new feature called [plugins][bp]. This
allows you to run xcss along with browserify and extract references to
stylesheets from your code, so you can write:

    require('./styles.xcss');

    ...

and have `./styles.xcss` bundled in a resulted stylesheet bundle.

The command-line usage of browserify + xcss looks like:

    browserify -p [ xcss -o ./bundle.css ] -o ./bundle.js ./index.js

After running this you will have `bundle.js` and `bundle.css` created in the
directory.

If you use browserify programatically, then usage is as follows:

    var fs = require('fs')
    var browserify = require('browserify')
    var xcss = require('xcss')

    var b = browserify('./index.js').plugin(xcss)
    var stream = b.bundle()
    stream.pipe(fs.createWriteStream('bundle.js'))
    stream.css.pipe(fs.createWriteStream('bundle.css'))

[bp]: https://github.com/substack/node-browserify#plugins
