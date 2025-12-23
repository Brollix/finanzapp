# ADR 002: Error Handling Strategy

## Status
Accepted

## Context
The application needed a consistent way to handle and report errors across different layers (API, services, database). Previously, errors were handled inconsistently with generic Error objects.

## Decision
We will implement a structured error handling approach:

1. **Custom Error Classes**: Create specific error types for different failure scenarios
   - `ValidationError`: Input validation failures (400)
   - `AuthenticationError`: Auth failures (401)
   - `RateLimitError`: Rate limiting (429)
   - `OCRProcessingError`: OCR failures (500)
   - `BedrockError`: AI processing failures (500)
   - `DatabaseError`: Database operation failures (500)

2. **Error Middleware**: Global error handler that:
   - Maps error types to appropriate HTTP status codes
   - Logs errors with context
   - Returns consistent error response format
   - Captures errors in Sentry (except validation errors)

3. **Error Response Format**:
   ```json
   {
     "error": "ERROR_CODE",
     "message": "Human-readable message",
     "details": {} // Optional, for validation errors
   }
   ```

## Consequences

### Positive
- Consistent error handling across the application
- Better debugging with error codes
- Improved user experience with clear error messages
- Better observability with Sentry integration

### Negative
- Additional code to maintain
- Need to ensure all errors use custom classes

## Implementation
- Custom error classes in `src/utils/errors.ts`
- Global error handler in `src/app.ts`
- Sentry integration for error tracking

