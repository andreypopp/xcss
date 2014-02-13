function decl(name) {
  return {message: "hello, " + name};
}

module.exports = decl;
module.exports.decl = decl;
