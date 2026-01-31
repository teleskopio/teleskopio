GOCMD=go
GOTEST=$(GOCMD) test
BRANCH := $(shell git rev-parse --abbrev-ref HEAD)
HASH := $(shell git rev-parse --short HEAD)
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
CYAN   := $(shell tput -Txterm setaf 6)
RESET  := $(shell tput -Txterm sgr0)

PROJECT_NAME := teleskopio
LINTER_BIN ?= golangci-lint
LINTER_VERSION ?= v2.4.0

.PHONY: all test build clean run lint /bin/$(LINTER_BIN)

all: help

## Build:
build: ## Build all the binaries and put the output in bin/
	$(GOCMD) build -ldflags "-X main.version=$(BRANCH)-$(HASH)" -o bin/$(PROJECT_NAME) .

## Build frontend:
build-frontend: ## Build frontend
	cd frontend && pnpm build && cp -R dist ../

build-docker: ## Build an image
	docker build --build-arg APP_VERSION=$(BRANCH)-$(HASH) -t $(PROJECT_NAME) .


bin/$(LINTER_BIN):
	curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b ./bin $(LINTER_VERSION)

## Clean:
clean: ## Remove build related file
	@-rm -fr ./bin

## Lint:
lint: ./bin/$(LINTER_BIN) ## Lint sources with golangci-lint
	./bin/$(LINTER_BIN) run

lint-frontend: ## Lint frontend
	cd frontend && pnpm run lint

## Run docker
run-docker: ## Run docker container
	docker run -it --rm -p 3080:3080 -v $(PWD)/config.yaml:/etc/config.yaml $(PROJECT_NAME) --config=/etc/config.yaml

## Run frontend:
run-frontend: ## Run
	cd frontend && pnpm dev

## Run backend:
run-backend: build ## Run
	./bin/$(PROJECT_NAME)

config: ## Generate default config
	./bin/$(PROJECT_NAME) config > ./config.yaml

## Test:
test: ## Run the tests
	$(GOTEST) -v -race ./...

## Help:
help: ## Show this help.
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} { \
		if (/^[a-zA-Z_-]+:.*?##.*$$/) {printf "    ${YELLOW}%-20s${GREEN}%s${RESET}\n", $$1, $$2} \
		else if (/^## .*$$/) {printf "  ${CYAN}%s${RESET}\n", substr($$1,4)} \
		}' $(MAKEFILE_LIST)
