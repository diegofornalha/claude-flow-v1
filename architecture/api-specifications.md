# API Specifications

## API Design Principles

1. **RESTful Design**: Resource-oriented URLs with standard HTTP methods
2. **Versioning**: URL path versioning (e.g., /api/v1/)
3. **Pagination**: Cursor-based pagination for large datasets
4. **Filtering**: Query parameter based filtering
5. **Error Handling**: Consistent error response format
6. **Rate Limiting**: Token bucket algorithm with Redis

## Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "roles": ["customer"],
  "exp": 1234567890,
  "iat": 1234567890,
  "jti": "unique_token_id"
}
```

### API Gateway Headers
```
X-API-Key: <api_key>
Authorization: Bearer <jwt_token>
X-Request-ID: <unique_request_id>
X-Client-Version: <client_version>
```

## Core API Endpoints

### User Service API

#### Authentication Endpoints
```yaml
POST /api/v1/auth/register
  Request:
    {
      "email": "string",
      "password": "string",
      "firstName": "string",
      "lastName": "string"
    }
  Response:
    {
      "userId": "string",
      "email": "string",
      "accessToken": "string",
      "refreshToken": "string"
    }

POST /api/v1/auth/login
  Request:
    {
      "email": "string",
      "password": "string"
    }
  Response:
    {
      "accessToken": "string",
      "refreshToken": "string",
      "expiresIn": 3600
    }

POST /api/v1/auth/refresh
  Request:
    {
      "refreshToken": "string"
    }
  Response:
    {
      "accessToken": "string",
      "expiresIn": 3600
    }

POST /api/v1/auth/logout
  Headers:
    Authorization: Bearer <token>
  Response:
    {
      "message": "Logged out successfully"
    }
```

#### User Management Endpoints
```yaml
GET /api/v1/users/profile
  Headers:
    Authorization: Bearer <token>
  Response:
    {
      "userId": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "phoneNumber": "string",
      "addresses": [],
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }

PUT /api/v1/users/profile
  Headers:
    Authorization: Bearer <token>
  Request:
    {
      "firstName": "string",
      "lastName": "string",
      "phoneNumber": "string"
    }
  Response:
    {
      "message": "Profile updated successfully"
    }

POST /api/v1/users/addresses
  Headers:
    Authorization: Bearer <token>
  Request:
    {
      "type": "shipping|billing",
      "street": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "zipCode": "string",
      "isDefault": "boolean"
    }
  Response:
    {
      "addressId": "string",
      "message": "Address added successfully"
    }
```

### Product Service API

#### Product Endpoints
```yaml
GET /api/v1/products
  Query Parameters:
    - page: number (default: 1)
    - limit: number (default: 20, max: 100)
    - category: string
    - minPrice: number
    - maxPrice: number
    - sortBy: string (price|name|rating|createdAt)
    - order: string (asc|desc)
  Response:
    {
      "products": [
        {
          "productId": "string",
          "name": "string",
          "description": "string",
          "price": "number",
          "currency": "string",
          "images": ["string"],
          "category": "string",
          "stock": "number",
          "rating": "number",
          "reviewCount": "number"
        }
      ],
      "pagination": {
        "page": "number",
        "limit": "number",
        "total": "number",
        "hasNext": "boolean"
      }
    }

GET /api/v1/products/{productId}
  Response:
    {
      "productId": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "currency": "string",
      "images": ["string"],
      "category": "string",
      "subcategory": "string",
      "brand": "string",
      "attributes": {},
      "stock": "number",
      "rating": "number",
      "reviews": [],
      "relatedProducts": []
    }

GET /api/v1/products/search
  Query Parameters:
    - q: string (search query)
    - filters: object (faceted search filters)
  Response:
    {
      "results": [],
      "facets": {
        "categories": [],
        "brands": [],
        "priceRanges": []
      },
      "totalResults": "number"
    }
```

### Cart Service API

#### Cart Management
```yaml
GET /api/v1/cart
  Headers:
    Authorization: Bearer <token> (optional for guest)
    X-Session-ID: <session_id> (for guest users)
  Response:
    {
      "cartId": "string",
      "items": [
        {
          "itemId": "string",
          "productId": "string",
          "name": "string",
          "price": "number",
          "quantity": "number",
          "subtotal": "number"
        }
      ],
      "subtotal": "number",
      "tax": "number",
      "shipping": "number",
      "total": "number"
    }

POST /api/v1/cart/items
  Headers:
    Authorization: Bearer <token> (optional)
    X-Session-ID: <session_id> (for guest)
  Request:
    {
      "productId": "string",
      "quantity": "number"
    }
  Response:
    {
      "itemId": "string",
      "message": "Item added to cart"
    }

PUT /api/v1/cart/items/{itemId}
  Request:
    {
      "quantity": "number"
    }
  Response:
    {
      "message": "Cart updated"
    }

DELETE /api/v1/cart/items/{itemId}
  Response:
    {
      "message": "Item removed from cart"
    }
```

### Order Service API

#### Order Management
```yaml
POST /api/v1/orders
  Headers:
    Authorization: Bearer <token>
  Request:
    {
      "shippingAddressId": "string",
      "billingAddressId": "string",
      "paymentMethodId": "string",
      "items": [
        {
          "productId": "string",
          "quantity": "number"
        }
      ]
    }
  Response:
    {
      "orderId": "string",
      "orderNumber": "string",
      "status": "pending",
      "total": "number",
      "estimatedDelivery": "ISO8601"
    }

GET /api/v1/orders
  Headers:
    Authorization: Bearer <token>
  Query Parameters:
    - page: number
    - limit: number
    - status: string
  Response:
    {
      "orders": [],
      "pagination": {}
    }

GET /api/v1/orders/{orderId}
  Headers:
    Authorization: Bearer <token>
  Response:
    {
      "orderId": "string",
      "orderNumber": "string",
      "status": "string",
      "items": [],
      "shipping": {},
      "payment": {},
      "timeline": [],
      "trackingInfo": {}
    }

PUT /api/v1/orders/{orderId}/cancel
  Headers:
    Authorization: Bearer <token>
  Request:
    {
      "reason": "string"
    }
  Response:
    {
      "message": "Order cancelled",
      "refundStatus": "processing"
    }
```

### Payment Service API

#### Payment Processing
```yaml
POST /api/v1/payments/methods
  Headers:
    Authorization: Bearer <token>
  Request:
    {
      "type": "card|paypal|applepay",
      "cardNumber": "string", // tokenized
      "expiryMonth": "string",
      "expiryYear": "string",
      "cvv": "string",
      "billingAddressId": "string"
    }
  Response:
    {
      "paymentMethodId": "string",
      "last4": "string",
      "brand": "string"
    }

POST /api/v1/payments/process
  Headers:
    Authorization: Bearer <token>
  Request:
    {
      "orderId": "string",
      "paymentMethodId": "string",
      "amount": "number",
      "currency": "string"
    }
  Response:
    {
      "transactionId": "string",
      "status": "success|pending|failed",
      "message": "string"
    }

POST /api/v1/payments/refunds
  Headers:
    Authorization: Bearer <token>
  Request:
    {
      "transactionId": "string",
      "amount": "number",
      "reason": "string"
    }
  Response:
    {
      "refundId": "string",
      "status": "processing",
      "estimatedCompletion": "ISO8601"
    }
```

## Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error details"
    },
    "requestId": "unique-request-id",
    "timestamp": "ISO8601"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: 401 - Invalid or missing authentication
- `FORBIDDEN`: 403 - Insufficient permissions
- `NOT_FOUND`: 404 - Resource not found
- `VALIDATION_ERROR`: 400 - Invalid request data
- `RATE_LIMITED`: 429 - Too many requests
- `INTERNAL_ERROR`: 500 - Server error

## Rate Limiting

Rate limits are enforced per API key:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

### Rate Limit Tiers
- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Premium**: 10000 requests/hour

## Webhook Events

Services emit webhook events for async notifications:

```json
{
  "event": "order.completed",
  "timestamp": "ISO8601",
  "data": {
    "orderId": "string",
    "userId": "string",
    "total": "number"
  },
  "signature": "HMAC-SHA256"
}
```

### Event Types
- `user.registered`
- `user.updated`
- `order.created`
- `order.completed`
- `order.cancelled`
- `payment.succeeded`
- `payment.failed`
- `inventory.low_stock`
- `cart.abandoned`