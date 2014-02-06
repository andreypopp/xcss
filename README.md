# xCSS

xCSS is a library for programmable stylesheet composition.

The idea is to produce CSS by composing data structures using JavaScript. That
way you don't need preprocessors like Sass, Less or Stylus. Instead, all the
power of JavaScript is at your fingertips.

Moreover xCSS is based on Node.js and allows you to reuse its module system and
even package manager, npm with thousands of packages there.

But writing CSS with JavaScript can be verbose. To fix that xCSS provides a
compiler from xCSS (a language, a superset of CSS) to JavaScript.

Example xCSS modules looks like:

    @import "./other-stylesheet.xcss";

    @require "some-pkg/theme" as theme;

    .Component {
      width: 12px;
      background-color: {theme.bgColor};
    }

Compiles into the CommonJS module using xCSS object model:

    var xcss = require("xcss"),
        theme = require("some-pkg/theme");

    module.exports = xcss.Stylesheet(
      xcss.Import(require("./other-stylesheet.xcss")),
      xcss.Rule('.Component', {
        width: '12px',
        backgroundColor: theme.bgColor
      })
    );

Now to get the CSS string from that you just need to evaluate this module in
Node, the module's value is a `xcss.Stylesheet` object which has `.toString()`
method.
