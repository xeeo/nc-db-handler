NAME=nc-db-handler
VERSION=latest

test:
	@istanbul cover _mocha -- --debug --recursive -w

clean:
	@rm -f npm-shrinkwrap.json
	@rm -rf ./node_modules
	npm install
	npm shrinkwrap

install:
	@rm -rf ./node_modules
	npm install

docker-build:
	@docker build -t $(NAME) -f docker/Dockerfile .

run:	docker-build
	@docker-compose -f docker/docker-compose.yml run --rm pluginDev

coverage:
	istanbul cover _mocha -- --debug --recursive

check-jscs:
	@git add . && git diff --name-only | grep '.js' | xargs jscs || exit 0

check-jshint:
	@git add . && git diff --name-only | grep '.js' | xargs jshint || exit 0

check-code:
	@watch -n 1 'make -s check-jscs && make -s check-jshint'

.PHONY: test clean install docker-build run jenkins-run jenkins-build jenkins-cover check-jscs check-jshint check-code
