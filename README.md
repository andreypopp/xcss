# xCSS

**WARNING:** This version of xCSS isn't released yet. On npm there's older
verison of xcss which is just runner for rework transforms.

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

    module.exports = xcss.stylesheet(null,
      xcss.import(require("./other-stylesheet.xcss")),
      xcss.rule('.Component', {
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
