# xcss

CSS bundler with the following features:

  * Dependency resolution using Node module resolution algorithm.
  * Stylesheet AST transformations in spirit of rework.
  * Source maps support.
  * Elimination of unused class rules (not implemented).
  * Compression of class names in selectors (not implemented).

## Installation

    % npm install xcss

## Usage

    Usage: xcss [options] entry

    Options:
      -h, --help       Show this message and exit
      -v, --version    Print xcss version and exit
      -d, --debug      Emit source maps
      -t, --transform  Apply transform
