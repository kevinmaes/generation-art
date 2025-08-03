# Development Guide

This guide covers development workflows, scripts, and CI/CD processes for the generation-art project.

## Available Scripts

### Development

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Vite development server |
| `pnpm dev:full` | Build example data + start dev server |
| `pnpm dev:with-gedcom` | Build GEDCOM data + start dev server |

### GEDCOM Processing

| Script | Description |
|--------|-------------|
| `pnpm build:gedcom <file>` | Process a GEDCOM file through the CLI pipeline |
| `pnpm build:gedcom:example` | Process the example Kennedy GEDCOM file |

### Testing

| Script | Description |
|--------|-------------|
| `pnpm test` | Run all tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Generate coverage report |
| `pnpm test path/to/test.spec.ts` | Run a single test file |

### Code Quality

| Script | Description |
|--------|-------------|
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | Check TypeScript types |
| `pnpm checks` | Run all checks (lint + typecheck + format) |

### Build

| Script | Description |
|--------|-------------|
| `pnpm build` | Production build (runs typecheck + vite build) |

### Local CI Testing

| Script | Description |
|--------|-------------|
| `pnpm ci:local` | Test main app quality and unit test workflows locally |
| `pnpm ci:local:quality` | Test all quality check workflows (app, cli, shared) |
| `pnpm ci:local:tests` | Test all unit test workflows (app, cli, shared) |
| `pnpm ci:local:all` | Test all GitHub Actions workflows locally |

#### Local CI Usage

```bash
# List workflows that would run
pnpm ci:local:quality --list

# Run quality checks locally
pnpm ci:local:quality

# Run just the tests
pnpm ci:local:tests

# Run everything
pnpm ci:local:all
```

**Note**: Local CI testing uses [act](https://github.com/nektos/act) to simulate GitHub Actions in Docker. On Apple M-series chips, you may need to add `--container-architecture linux/amd64` if you encounter issues.

## CI/CD Workflows

The project uses GitHub Actions for automated quality assurance and testing. All workflows automatically run on pull requests to the `dev` branch.

### Quality Check Workflows

These workflows ensure code quality standards across the codebase:

| Workflow | File | Triggers | Purpose |
|----------|------|----------|---------|
| **App Quality** | `quality-app.yml` | Changes to `client/**` | ESLint, Prettier, TypeScript for client code |
| **CLI Quality** | `quality-cli.yml` | Changes to `cli/**` or `shared/**` | ESLint, Prettier, TypeScript for CLI code |
| **Shared Quality** | `quality-shared.yml` | Changes to `shared/**` | ESLint, Prettier, TypeScript for shared code |

### Unit Test Workflows

These workflows run tests and generate coverage reports:

| Workflow | File | Triggers | Purpose |
|----------|------|----------|---------|
| **App Tests** | `test-unit-app.yml` | Changes to `client/**` | Unit tests with coverage for client code |
| **CLI Tests** | `test-unit-cli.yml` | Changes to `cli/**` or `shared/**` | Unit tests with coverage for CLI code |
| **Shared Tests** | `test-unit-shared.yml` | Changes to `shared/**` | Unit tests with coverage for shared code |

### Auto-Fix Workflow

| Workflow | File | Triggers | Purpose |
|----------|------|----------|---------|
| **Fix Formatting** | `fix-formatting.yml` | Pull requests to `dev` | Automatically fixes formatting/linting issues and commits back to PR |

### Workflow Features

- **Smart Path Filtering**: Workflows only run when relevant files change, optimizing CI execution time
- **Coverage Reporting**: Test coverage is automatically sent to Codecov with package-specific flags
- **Auto-Fix**: The formatting workflow can automatically fix issues and push fixes back to PRs
- **Manual Triggers**: All workflows can be manually triggered via `workflow_dispatch`

## Development Workflow

### Local Development

1. **Make changes** to code
2. **Run quality checks** locally:
   ```bash
   pnpm checks  # Run lint + typecheck + format
   ```
3. **Run tests** to ensure functionality:
   ```bash
   pnpm test
   ```
4. **Test CI workflows** locally (optional):
   ```bash
   pnpm ci:local:quality
   ```

### Pre-Push Protection

The project uses Husky pre-push hooks that automatically run:
- Code formatting checks (`pnpm format:check`)
- Linting checks (`pnpm lint`)

If these checks fail, the push is blocked until issues are resolved.

### Pull Request Process

1. **Create PR** targeting `dev` branch
2. **Automated workflows** run based on changed files
3. **Auto-fix workflow** may commit formatting fixes back to your PR
4. **Review process** once all checks pass
5. **Merge** after approval

## Package Structure

The project is organized for future monorepo migration:

```
├── client/          # React application
├── cli/             # Command-line tools
├── shared/          # Shared types and utilities
├── .github/         # GitHub Actions workflows
└── docs/            # Documentation
```

Each package has its own workflows to enable independent testing and deployment.

## Troubleshooting

### Common Issues

**Pre-push hook failures**: Run `pnpm format` and `pnpm lint:fix` to resolve common issues.

**Act/Docker issues on M1 Macs**: Add `--container-architecture linux/amd64` to act commands.

**Workflow not running**: Check if your changes match the path filters in `.github/workflows/`.

### Getting Help

- Check workflow logs in GitHub Actions tab
- Review error messages from pre-push hooks
- Ensure all dependencies are installed with `pnpm install`