# xCSS

**WARNING:** This version of xCSS isn't released yet. On npm there's older
verison of xcss which is just runner for rework transforms.

xCSS is a library for programmatic stylesheet composition.

The idea is to produce CSS by composing data structures in JavaScript. That way
you don't need preprocessors like Sass, Less or Stylus. Instead, all the power
of JavaScript is at your fingertips.

Moreover xCSS is based on Node.js and allows you to reuse its module system and
even package manager, [npm](http://npmjs.org) with thousands of packages there.

But writing CSS with JavaScript can be verbose. To fix that xCSS provides a
compiler from xCSS (a language, a superset of CSS) to JavaScript.

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
        vars = {},
        theme = require("some-pkg/theme");

    module.exports = xcss.stylesheet(vars,
      xcss.import(require("./other-stylesheet.xcss")),
      xcss.rule('.Component', {
        width: '12px',
        backgroundColor: theme.bgColor
      })
    );

Now to get the CSS string from that you just need to evaluate this module in
Node, the module's value is a `xcss.Stylesheet` object which has `.toCSS()`
method.

  * [Installation](#installation)
  * [Using from command-line usage](#using-from-command-line)
  * [Using from Node.js](#using-from-nodejs)
  * [Guide](#guide)
    * [Modules: to structure your stylesheets](#modules)
    * [Using JavaScript: variables and utility functions](#using-javascript-variables-and-utility-functions)
    * [Rule extensions](#rule-extensions)
    * [Hooks: to extend xCSS](#hooks-how-to-extend-xcss)
    * [Parametrised modules: to create reusable stylesheets](#parametrised-modules-how-to-create-reusable-stylesheets)
    * [Writing transforms: to extend xCSS compiler](#writing-transforms-to-extend-xcss-compiler)
  * [xCSS object model](#xcss-object-model)
    * [`xcss.Stylesheet`](#xcssstylesheet)
    * [`xcss.Stylesheet.toCSS()`](#xcssstylesheettocss)
    * [`xcss.Stylesheet.concat(stylesheet)`](#xcssstylesheetconcatstylesheet)
    * [`xcss.Stylesheet.transform(fn)`](#xcssstylesheettransformfn)
    * [`xcss.Stylesheet.map(fn)`](#xcssstylesheetmapfn)
    * [`xcss.Stylesheet.filter(fn)`](#xcssstylesheetfilterfn)
    * [`xcss.Stylesheet.flatMap(fn)`](#xcssstylesheetflatmapfn)
    * [`xcss.Rule`](#xcssrule)
    * [`xcss.Rule.addSelector(selector)`](#xcssruleaddselectorselector)
    * [`xcss.Rule.map(fn)`](#xcssrulemapfn)
    * [`xcss.Rule.filter(fn)`](#xcssrulefilterfn)
    * [`xcss.Rule.flatMap(fn)`](#xcssruleflatmapfn)
    * [`xcss.Import`](#xcssimport)
    * [`xcss.Extend`](#xcssextend)
    * [`xcss.Module`](#xcssmodule)
  * [xCSS syntax references](#xcss-syntax-references)
    * [`@import`](#import)
    * [`@require`](#require)
    * [`extend` declaration and placeholders](#extend-declaration-and-placeholders)
    * [`@module`](#module)

## Installation

Install via npm:

    % npm install --global xcss

## Using from command-line

After installation there's `xcss` command line utility, which generates a CSS
from a given xCSS module:

    % xcss ./index.xcss > bundle.css

Run `xcss --help` to see more options:

    % xcss --help
    usage: xcss [-ch] <filename>

    Compile xCSS to CSS and print the result.

    options:

        -c, --compile  Print the result of translation from xCSS to JavaScript

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

See the reference on [xCSS object model](#xcss-object-model) to learn all the
methods available to you.

## Guide

The most important thing to remember when writing your stylesheets is that xCSS
language is a superset of CSS. That means that any valid CSS file is also a
valid xCSS module:

    body {
      font-family: sans-serif;
    }

    .main {
      margin: 0 auto;
    }

This fact allows you to introduce xCSS to a new project incrementally, starting
using its features as needed.

This guide walks you through the features unique to xCSS.

### Modules

Modules answer the question of how to structure stylesheets in your application.

xCSS being just a sugar over xCSS object model inherits the module system and
the entire package ecosystem of Node.js.

There's a one-to-one correspondence between xCSS files and modules, so any xCSS
file is a module. Modules can include other modules by referring to each other
by `@import` directive:

    @import "./button.xcss";

    body {
      ...
    }

The `@import` directive can also load modules from a different npm package —
`@import "pkg/style.xcss"` — where `pkg` is a name of a package installed from
npm.

Remember that `@import "some/module"` compiles into `require("some/module")` and
so works according to [Node module
resolution](http://nodejs.org/api/modules.html#modules_all_together).

Modules allow you to decompose your stylesheets not only into a set of files but
into a set of reusable packages which are easily installable, thanks to npm.

Also xCSS takes care to not to include same module twice, even if you reference
it from different places.

### Using JavaScript: variables and utility functions

There's a way to include snippets of JavaScript in your stylesheet. It is useful
when you want to compute a value of some declaration based on some variable or
use a function to transform values.

xCSS makes it possible by using `{}`-quotes:

    body {
      margin: {10 + 20}px;
    }

Will result in a CSS:

    body {
      margin: 30px;
    }

The basic rule is that everything inside `{}` is a plain JavaScript. You can
even use functions to compute values — `{Math.pow(2, 4)}`. There's no need to
learn a new language.

But how do you use some variable or function from another module? For that
there's `@require ... as ...` directive:

    @require "./utils.js" as utils

The line above will call `require("./utils.js")` and bring it into the scope
under the name `utils`. That allows to use variables and functions declared
there inside `{}` directly:

    @require "./utils.js" as utils

    body {
      background: {utils.bg}
    }

    a {
      color: {utils.colors.darken("red", 10)}
    }

### Rule extensions

### Hooks: how to extend xCSS

### Parametrised modules: how to create reusable stylesheets?

### Writing transforms: how to extend xCSS compiler

## xCSS object model

xCSS features immutable object model. That means every change to an object
yields a new instance instead of mutating the old one.

For example to add a selector to a rule you have to call method
`.addSelector(selector)` which would return a new modified copy of the original
rule:

    var modifiedRule = rule.addSelector('body');

That makes reasoning about state of your stylesheets easier and simplifies
implementation which in turn reduces number of possible bugs.

### `xcss.Stylesheet`

Represents a stylesheet, a collection of rules.

Can be constructed using `xcss.stylesheet(vars, rules...)` function.

Stylesheet has the following attributes:

  * `vars` — variables

  * `rules` — read-only array of rules

##### `xcss.Stylesheet.toCSS()`

Serialize stylesheet into a CSS string.

##### `xcss.Stylesheet.concat(stylesheet)`

Concat a stylesheet to another stylesheet and return a combined one as a result.

##### `xcss.Stylesheet.transform(fn)`

Apply a transform function `fn(stylesheet)` to stylesheet and a return a new
transformed stylesheet as a result.

##### `xcss.Stylesheet.map(fn)`

Produce a new stylesheet by mapping `fn(rule)` function over all rules.

##### `xcss.Stylesheet.filter(fn)`

Produce a new stylesheet by filtering rules with an `fn(rule)` function.

##### `xcss.Stylesheet.flatMap(fn)`

Produce a new stylesheet by running an `fn(rule)` function over all rules where
`fn` can return not just another rule but an array of rules (an empty one is
also valid). That way `flatMap` can be used in cases where you want to shrink or
grow a set of rules in a stylesheet according to some logic.

### `xcss.Rule`

Represents a single rule, a collection of declarations.

Can be constructed using `xcss.rule(declarations...)` function which accepts an
array of declarations.

Rule has the following attributes:

  * `declarations` — read-only array of declarations

##### `xcss.Rule.addSelector(selector)`

Produce a new rule by adding a new `selector`.

##### `xcss.Rule.map(fn)`

Produce a new rule by mapping an `fn(declaration)` function over all declarations.

##### `xcss.Rule.filter(fn)`

Produce a new rule by filtering declarations with an `fn(declaration)` function.

##### `xcss.Rule.flatMap(fn)`

Produce a new rule by running an `fn(rule)` function over all rules where `fn`
can return not just another declaration but an array of declaration (an empty
one is also valid). That way `flatMap` can be used in cases where you want to
shrink or grow a set of declaration in a rule according to some logic.

### `xcss.Import`

Represents a reference to another stylesheet which should be included in-place.

Can be constructed using `xcss.import(stylesheet)` function which accepts a
reference to a stylesheet.

### `xcss.Extend`

A special type of declaration which specifies xCSS rule extension.

Can be constructed using `xcss.extend(selector)` function which accepts a
selector string.

### `xcss.Module`

Represents a module, parametrized stylesheet.

Can be constructed using `xcss.module(fn)` function which takes another function
`fn` as an argument. Such function should return a new stylesheet when it's
called.

## xCSS syntax reference

### @import

### @require

### @vars

### extend declaration and placeholders

### @module
