.PHONY: help install-hooks dev build test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push hooks-post-checkout hooks-post-merge

help:
	@printf "%s\n" \
		"make install-hooks     Wire local git hooks" \
		"make dev               Run the Vite dev server" \
		"make build             Build GitHub Pages output into docs/" \
		"make test              Run unit tests" \
		"make test-integration  Placeholder for future integration tests" \
		"make smoke             Serve docs/ and run Playwright smoke checks" \
		"make lint              Run ESLint and TypeScript" \
		"make fmt               Format source files" \
		"make pages-preview     Serve docs/ like GitHub Pages" \
		"make release           Build, smoke, tag v$$(node -p \"require('./package.json').version\")" \
		"make clean             Remove local build and test caches"

install-hooks:
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev:
	npm run dev

build:
	npm run build
	test -f docs/index.html
	test -f docs/404.html

test:
	npm run test

test-integration:
	@printf "%s\n" "No integration tests are required for Mode A v1."

smoke:
	npm run smoke

lint:
	npm run lint
	npm run typecheck
	npm run format:check

fmt:
	npm run format

pages-preview:
	npm run pages-preview

release: build smoke
	git tag "v$$(node -p 'require("./package.json").version')"

clean:
	rm -rf dist coverage playwright-report test-results .vite .vitest node_modules/.tmp

hooks-pre-commit:
	npm run format:check
	npm run lint
	npm run typecheck
	@if command -v gitleaks >/dev/null 2>&1; then gitleaks protect --staged --redact; else printf "%s\n" "gitleaks not installed; skipping secret scan"; fi

hooks-commit-msg:
	node scripts/validate-commit-msg.mjs "$${COMMIT_MSG_FILE:-}"

hooks-pre-push:
	$(MAKE) test
	$(MAKE) build
	$(MAKE) smoke

hooks-post-checkout:
	npm install

hooks-post-merge:
	npm install
