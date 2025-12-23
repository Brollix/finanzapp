# ADR 001: Testing Strategy

## Status
Accepted

## Context
FinanzApp initially had minimal test coverage (<5%), with only a basic health check test. As the application grows and handles critical financial data processing, we need a robust testing strategy to ensure reliability and prevent regressions.

## Decision
We will implement a comprehensive testing strategy with the following components:

1. **Unit Tests**: Test individual functions and services in isolation
   - Focus on critical business logic (number parsing, validation, data transformation)
   - Use Jest with mocking for external dependencies (AWS, Supabase)

2. **Integration Tests**: Test service interactions
   - Test API endpoints with Supertest
   - Mock external services but test internal service integration

3. **Coverage Goals**: 
   - Minimum 50% coverage for critical paths
   - Target 70%+ coverage for services handling financial data

4. **Test Organization**:
   - Tests co-located with source files or in `tests/` directory
   - Use descriptive test names following pattern: `should [expected behavior] when [condition]`

## Consequences

### Positive
- Early detection of bugs before production
- Confidence in refactoring
- Documentation through tests
- Regression prevention

### Negative
- Additional development time
- Maintenance overhead
- Need to keep tests updated with code changes

## Implementation
- Jest configured with TypeScript support
- Tests for critical services: `bedrock.service`, `database.service`, `auth.middleware`
- CI/CD pipeline runs tests on every PR

