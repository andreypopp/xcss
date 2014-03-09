PATH := ./node_modules/.bin:$(PATH)

install link:
	@npm $@

lint:
	@jshint index.js lib/*.js

test:: test-unit test-functional

test-unit::
	@jspecs -b -R spec specs/*.jspc

test-functional::
	@mocha -b -R spec specs/*.js

release-patch: test lint
	@$(call release,patch)

release-minor: test lint
	@$(call release,minor)

release-major: test lint
	@$(call release,major)

publish:
	git push --tags origin HEAD:master
	npm publish

define release
	npm version $(1)
endef
