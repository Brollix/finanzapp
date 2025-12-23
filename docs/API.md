# FinanzApp API Documentation

## Base URL

- **Production**: `https://d245522eugz5ge.cloudfront.net`
- **Development**: `http://localhost:8080`

## Authentication

All endpoints (except health checks) require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <supabase_access_token>
```

## Endpoints

### Health Checks

#### GET /health
Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "finanzapp-aws-api"
}
```

#### GET /health/live
Liveness probe - checks if the application is running.

**Response:**
```json
{
  "status": "alive"
}
```

#### GET /health/ready
Readiness probe - checks if the application can serve requests (database connectivity).

**Response:**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok"
  }
}
```

### Receipt Processing

#### POST /api/receipt/process
Process a receipt image using OCR and AI.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `image` field (file)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "supermarket": "Carrefour",
    "datetime": "01/01/2024 10:00:00",
    "total": 1000.5,
    "items": [...],
    "user_id": "uuid",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "jobId": "timestamp-uuid"
}
```

**Rate Limit:** 10 requests per hour per IP

#### GET /api/receipt/process/:jobId/status
Get processing status for a job.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "extracting_text" | "processing_ai" | "saving" | "completed" | "error",
    "progress": 0-100,
    "message": "Processing...",
    "receiptId": "uuid",
    "error": "Error message"
  }
}
```

#### POST /api/receipt/manual
Create a receipt manually without image processing.

**Request:**
```json
{
  "receiptData": {
    "supermarket": "Carrefour",
    "datetime": "01/01/2024 10:00:00",
    "total": 1000.5,
    "items": [
      {
        "product": "Leche",
        "quantity": 1,
        "price": 100,
        "brand": "La Serenísima",
        "discount": 10,
        "promotion": "2x1",
        "is_weight": false
      }
    ],
    "discounts": [
      {
        "description": "Descuento especial",
        "amount": 50
      }
    ],
    "total_saved": 60
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

#### PUT /api/receipt/:id
Update an existing receipt.

**Request:** Same as POST /api/receipt/manual

**Response:** Updated receipt object

#### GET /api/receipt/:id
Get a receipt by ID.

**Response:** Receipt object

#### GET /api/receipt/user/me
Get all receipts for the authenticated user.

**Query Parameters:**
- `limit` (optional): Maximum number of receipts to return (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {} // Optional, for validation errors
}
```

### Error Codes

- `VALIDATION_ERROR` (400): Invalid input data
- `AUTH_ERROR` (401): Authentication failed
- `RATE_LIMIT` (429): Too many requests
- `OCR_FAILED` (500): OCR processing failed
- `BEDROCK_ERROR` (500): AI processing failed
- `DATABASE_ERROR` (500): Database operation failed
- `Internal Server Error` (500): Unexpected error

## Rate Limits

- General API: 100 requests per 15 minutes per IP
- Receipt processing: 10 requests per hour per IP

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests
- `RateLimit-Reset`: Time when the limit resets

