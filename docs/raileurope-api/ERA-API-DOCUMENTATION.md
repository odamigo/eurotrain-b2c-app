# Rail Europe ERA API Documentation

**Son Güncelleme:** 25 Ocak 2026
**Kaynak:** OpenAPI Spec Files + https://docs.era.raileurope.com
**Versiyon:** v4 - Complete with OpenAPI Specs

---

## İÇİNDEKİLER

1. [API Base URLs](#1-api-base-urls)
2. [Authentication](#2-authentication)
3. [Rate Limiting](#3-rate-limiting)
4. [API Endpoints](#4-api-endpoints)
5. [Glossary](#5-glossary)
6. [Data Models](#6-data-models)
7. [Booking Flow](#7-booking-flow)
8. [Prices and Fees](#8-prices-and-fees)
9. [Products Scope](#9-products-scope)
10. [Carrier Coverage](#10-carrier-coverage)
11. [Carrier Starter Kits](#11-carrier-starter-kits)
12. [Station Codes](#12-station-codes)
13. [Hold TTL & Grace Period](#13-hold-ttl--grace-period)
14. [Ticketing Methods](#14-ticketing-methods)
15. [Carrier Logos](#15-carrier-logos)
16. [Test Credentials](#16-test-credentials)
17. [API Change Log](#17-api-change-log)

---

## 1. API BASE URLS

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| **Authentication** | `https://authent-sandbox.era.raileurope.com` | OAuth2 token |
| **API Sandbox** | `https://api-sandbox.era.raileurope.com` | All other endpoints |
| **Mock Server** | `https://stoplight.io/mocks/rail-europe/era-api-doc/44050218` | Testing |

### Required Headers

| Header | Description | Required |
|--------|-------------|----------|
| `Authorization` | `Bearer {access_token}` | Yes (all except /oauth2/token) |
| `X-Point-Of-Sale` | Partner point of sale code | Yes |
| `X-CorrelationId` | UUID for request tracking | No |
| `Content-Type` | `application/json` | Yes |
| `Accept-Language` | Language (e.g., `en`, `fr`) | No |

### Fake Mode (Sandbox Only)

Add header to bypass inventory issues:
```
X-Fake-Mode: enabled
```
- Only for `POST /offers/point-to-point/searches`
- Booking reference prefixed with "F"
- Returns static PDF ticket
- **NOT available in production**

---

## 2. AUTHENTICATION

### Endpoint

```
POST https://authent-sandbox.era.raileurope.com/oauth2/token
Content-Type: application/x-www-form-urlencoded
```

### Request

```
grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET
```

### Response

```json
{
  "access_token": "eyJz93a...k4laUWw",
  "token_type": "Bearer",
  "expires_in": "3600"
}
```

### Usage

All subsequent API calls must include:
```
Authorization: Bearer eyJz93a...k4laUWw
```

### Token Refresh

Token expires after 3600 seconds (1 hour). Request new token before expiry.

---

## 3. RATE LIMITING

### Look2Book Ratio

| Metric | Limit |
|--------|-------|
| Searches per Booking | **70:1** maximum |
| Penalty | Charges apply if exceeded |
| Scope | Production only |

### Request Rate Limits

| Metric | Limit |
|--------|-------|
| Requests per 5 minutes | **4,250** per partner |
| Exceeded response | `HTTP 403 Forbidden` |
| Recovery | Automatic when below limit |

### Prohibited

- Scraping
- Bot-like activity
- May result in access block

---

## 4. API ENDPOINTS

### 4.1 Health Check

#### Get All Suppliers Health Status
```
GET /health/suppliers
Headers: Authorization, X-Point-Of-Sale, Accept-Language
```

**Response:**
```json
[
  { "id": "EUROSTAR", "status": "DOWN", "downtime": "PT3H35M38S" },
  { "id": "LYRIA", "status": "UP" },
  { "id": "RENFE", "status": "UP" },
  { "id": "SBB", "status": "UP" },
  { "id": "TRENITALIA", "status": "UP" },
  { "id": "NTV", "status": "UP" }
]
```

**Status Values:** `UP`, `UNSTABLE`, `DOWN`
**Downtime Format:** ISO 8601 duration (e.g., `PT40M46S` = 40 min 46 sec)

#### Get Specific Supplier Health
```
GET /health/suppliers/{supplierId}
```

---

### 4.2 Places (Stations)

#### Autocomplete Places
```
GET /places/autocomplete?query={query}&type={type}&size={size}&boost={boost}
Headers: Authorization, X-Point-Of-Sale
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search text (e.g., "par") |
| type | string | No | `city` or `station` |
| size | integer | No | Results count (default: 10) |
| boost | string | No | Prioritize `city` or `station` |

**Response:**
```json
[
  {
    "id": "uMDSd2MKLJ9YxiFdEQBZ",
    "type": "city",
    "code": "ES:barcelona",
    "uicCode": "7171801",
    "label": "Barcelona (All stations)",
    "localLabel": "Barcelona (Todas)",
    "country": {
      "code": "ES",
      "label": "Spain",
      "localLabel": "España"
    },
    "timezone": "Europe/Madrid",
    "location": { "lat": 41.379335, "lon": 2.139477 },
    "ticketOffice": null,
    "ticketMachine": null
  }
]
```

#### Get All Places
```
GET /places
Headers: Authorization, X-Point-Of-Sale
```

**Note:** Cache response locally. Update periodically (every 2 weeks or monthly).

---

### 4.3 Products

#### Get Point-to-Point Products
```
GET /products/point-to-point
Headers: Authorization, X-Point-Of-Sale
```

**Response:**
```json
[
  {
    "type": "point-to-point",
    "code": "SNCF_TGV_STANDARD_SEMIFLEX",
    "label": "TGV Standard Semi-Flex",
    "marketingCarrier": "TGV",
    "supplier": "SNCF",
    "paxType": { "code": "ADULT", "label": "Adult" },
    "cabinClass": {
      "code": "STANDARD",
      "label": "2nd Class",
      "comfortCategory": { "code": "STANDARD", "label": "Standard" }
    },
    "fare": {
      "label": "Semi-Flex",
      "flexibility": { "code": "SEMI_FLEX", "label": "Semi Flex", "level": "2" },
      "conditions": "Exchangeable with fee..."
    },
    "refundable": "WITH_CONDITION",
    "exchangeable": "YES"
  }
]
```

#### Get Pass Products
```
GET /products/passes
```

#### Get Reservation Products
```
GET /products/point-to-point-reservation
```

#### Get Option Products
```
GET /products/point-to-point-option
```

---

### 4.4 Point-to-Point Search

#### Search Journeys
```
POST /offers/point-to-point/searches
Headers: Authorization, X-Point-Of-Sale, X-CorrelationId (optional)
```

**Request Body:**
```json
{
  "legs": [
    {
      "origin": "FR:paris",
      "destination": "ES:barcelona",
      "departureDateTime": "2026-02-15T08:00:00"
    }
  ],
  "travelers": [
    {
      "id": "traveler-1",
      "age": 35,
      "cards": []
    }
  ],
  "multiProviderEnabled": false,
  "seatReservationOnly": false
}
```

**Roundtrip Request:**
```json
{
  "legs": [
    {
      "origin": "FR:paris",
      "destination": "ES:barcelona",
      "departureDateTime": "2026-02-15T08:00:00"
    },
    {
      "origin": "ES:barcelona",
      "destination": "FR:paris",
      "departureDateTime": "2026-02-20T18:00:00"
    }
  ],
  "travelers": [
    { "id": "traveler-1", "age": 35 }
  ]
}
```

**Passholder Fare Request:**
```json
{
  "legs": [
    {
      "origin": "FR:paris",
      "destination": "CH:geneva",
      "departureDateTime": "2026-02-15T08:00:00"
    }
  ],
  "travelers": [
    {
      "id": "traveler-1",
      "age": 35,
      "cards": [
        { "code": "EURAIL_PASS", "type": "TRAVEL_PASS" }
      ]
    }
  ]
}
```

**Response Structure:**
```json
{
  "id": "search-uuid",
  "pointOfSale": "YOUR_POS",
  "legs": [
    {
      "id": "leg-1",
      "origin": { "code": "FR:paris", "label": "Paris" },
      "destination": { "code": "ES:barcelona", "label": "Barcelona" },
      "departureDateTime": "2026-02-15T08:00:00",
      "solutions": [...]
    }
  ],
  "travelers": [...],
  "offers": [
    {
      "id": "offer-uuid",
      "location": "/offers/point-to-point/searches/{searchId}/offers/{offerId}",
      "legSolution": "solution-uuid",
      "comfortCategory": "STANDARD",
      "flexibility": "SEMI_FLEX",
      "amount": { "value": 89.00, "currency": "EUR" },
      "expirationDate": "2026-01-25T12:00:00Z",
      "travelerInformationRequired": false,
      "fareOffers": [...],
      "compatibleOffers": [...]
    }
  ],
  "products": [...],
  "services": [...],
  "highlights": [...]
}
```

#### Get Additional Results (Pagination)
```
POST /offers/point-to-point/searches/{searchId}?page=next
POST /offers/point-to-point/searches/{searchId}?page=previous
```

---

### 4.5 Pass Search

#### Search Passes
```
POST /offers/passes/searches
Headers: Authorization, X-Point-Of-Sale
```

**Request Body:**
```json
{
  "validityStartDate": "2026-03-01",
  "place": "EURAIL_GLOBAL",
  "travelers": [
    { "id": "traveler-1", "age": 35 }
  ]
}
```

**Response Structure:**
```json
{
  "id": "search-uuid",
  "offers": [
    {
      "id": "pass-offer-1",
      "location": "/offers/passes/searches/{searchId}/offers/{offerId}",
      "duration": "P1M",
      "periodType": "FLEXI",
      "travelClass": "FIRST",
      "validityStartDate": "2026-03-01",
      "amount": { "value": 450.00, "currency": "EUR" },
      "conditions": [...],
      "travelerPassOffers": [...]
    }
  ]
}
```

---

### 4.6 Bookings

#### Create Booking
```
POST /bookings
Headers: Authorization, X-Point-Of-Sale, X-CorrelationId (optional)
```

**Request Body (One-way):**
```json
{
  "items": [
    {
      "offerLocations": [
        "/offers/point-to-point/searches/{searchId}/offers/{offerId}"
      ]
    }
  ]
}
```

**Request Body (Roundtrip):**
```json
{
  "items": [
    {
      "offerLocations": [
        "/offers/point-to-point/searches/{searchId}/offers/{outboundOfferId}",
        "/offers/point-to-point/searches/{searchId}/offers/{inboundOfferId}"
      ]
    }
  ]
}
```

**Response:** Full Booking object with `bookingStatus: "CREATED"`

#### Retrieve Booking
```
GET /bookings/{bookingId}?refresh={boolean}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| refresh | boolean | Get live data from carrier (default: false) |

#### Search Bookings
```
GET /bookings?query={searchTerm}&sortBy={field}&sortOrder={order}&pageIndex={n}&pageSize={n}
```

**Query can contain:**
- Booking ID or reference
- Agency booking reference
- Contact name/email/phone
- Traveler name/email/phone
- PNR reference
- Ticket number

**Warning:** Rate limited - use `GET /bookings/{bookingId}` when possible.

---

### 4.7 Travelers

#### Update Travelers
```
PUT /bookings/{bookingId}/items/{itemId}/travelers
Headers: Authorization, X-Point-Of-Sale
```

**Request Body (Without Passport):**
```json
[
  {
    "id": "traveler-1",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-05-15",
    "email": "john@example.com",
    "phoneNumber": "+33612345678"
  }
]
```

**Request Body (With Passport - Eurostar/IRYO):**
```json
[
  {
    "id": "traveler-1",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-05-15",
    "email": "john@example.com",
    "phoneNumber": "+33612345678",
    "countryOfResidence": "FR",
    "travelerDocument": {
      "type": "PASSPORT",
      "countryCode": "FR",
      "documentNumber": "123456789",
      "expirationDate": "2030-12-31",
      "validDocument": true
    }
  }
]
```

#### Update Accommodation Preferences
```
PUT /bookings/{bookingId}/items/{itemId}/accommodation-preferences
```

---

### 4.8 Checkout Flow

#### 1. Prebook
```
POST /bookings/{bookingId}/checkout/prebook
Headers: Authorization, X-Point-Of-Sale, X-CorrelationId (optional)
```

**Request Body:**
```json
["booking-item-uuid-1", "booking-item-uuid-2"]
```

**Response:** Booking with `bookingStatus: "PREBOOKED"` and `expirationDate` (TTL)

#### 2. Hold (Optional)
```
POST /bookings/{bookingId}/checkout/hold
```

Guarantees price for carrier-specific duration.

#### 3. Pay
```
POST /bookings/{bookingId}/checkout/pay
```

**Note:** Not available for API partners - handled internally by Rail Europe.

#### 4. Confirm
```
POST /bookings/{bookingId}/checkout/confirm?printOption=PRINT_ASYNC
```

**Response:** Booking with `bookingStatus: "CONFIRMED"`

#### 5. Print (Get Tickets)
```
POST /bookings/{bookingId}/print
```

**Response includes `valueDocuments`:**
```json
{
  "bookingItems": [
    {
      "valueDocuments": [
        {
          "id": "doc-uuid",
          "type": "PAH",
          "url": "https://era.raileurope.com/tickets/..."
        }
      ],
      "ticketsCollectionReferences": [...],
      "mobileReferences": [...]
    }
  ]
}
```

---

### 4.9 After Sales

#### Quote Refund
```
POST /bookings/{bookingId}/refund/quote
```

**Request Body:**
```json
{
  "items": [
    { "id": "booking-item-uuid" }
  ]
}
```

#### Confirm Refund
```
POST /bookings/{bookingId}/refund/confirm
```

#### Exchange Quote
```
POST /bookings/{bookingId}/exchange/quote
```

#### Confirm Exchange
```
POST /bookings/{bookingId}/exchange/confirm
```

---

## 5. GLOSSARY

| Term | Definition |
|------|------------|
| **Booking** | Reservation containing 1+ booking items |
| **Booking Item** | Single offer unit from search |
| **Booking Fee** | Rail Europe fee (non-refundable, non-commissionable) |
| **Comfort Category** | Travel class: Standard, Comfort, Premium |
| **Fare** | Price per segment per passenger type |
| **Fare Offer** | Price identifier in API |
| **Flexibility** | Ticket flexibility: Full, Semi, Non-Flex |
| **Leg** | Direction (outbound/inbound) |
| **Meta-station** | Virtual place representing city |
| **Offer** | Total price for journey with specific comfort/flexibility |
| **Product** | Comfort × Flexibility combination |
| **Rail Pass** | Flexible travel ticket for region/duration |
| **Segment** | Direct A→B travel |
| **Service** | Onboard service (WiFi, bicycle, etc.) |
| **Solution** | Complete journey (1+ segments) |
| **TTL** | Ticket Time Limit - booking validity duration |

---

## 6. DATA MODELS

### 6.1 Place

```typescript
interface Place {
  id: string;
  type: "city" | "station";
  code: string;           // e.g., "FR:paris"
  uicCode?: string;       // International railway code
  label: string;
  localLabel: string;
  country: {
    code: string;
    label: string;
    localLabel: string;
  };
  timezone: string;
  location: { lat: number; lon: number };
  ticketOffice?: boolean;
  ticketMachine?: boolean;
}
```

### 6.2 Traveler

```typescript
interface Traveler {
  id: string;
  age: number;
  cards?: Array<{
    code: string;          // e.g., "EURAIL_PASS"
    type: "REDUCTION_CARD" | "TRAVEL_PASS";
    number?: string;
  }>;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phoneNumber?: string;    // International format: +33612345678
  countryOfResidence?: string;
  travelerDocument?: {
    type: "PASSPORT" | "ID_CARD";
    countryCode: string;
    documentNumber: string;
    expirationDate: string;
    validDocument: boolean;
  };
}
```

### 6.3 Offer

```typescript
interface PointToPointOffer {
  id: string;
  location: string;        // API path to offer
  legSolution: string;     // Solution ID
  comfortCategory: "STANDARD" | "COMFORT" | "PREMIER";
  flexibility: "NON_FLEX" | "SEMI_FLEX" | "FULL_FLEX";
  amount: { value: number; currency: string };
  expirationDate: string;
  travelerInformationRequired: boolean;
  fareOffers: FareOffer[];
  serviceOffers?: ServiceOffer[];
  compatibleOffers?: string[];  // For roundtrip
}
```

### 6.4 Booking

```typescript
interface Booking {
  id: string;
  bookingReference: string;     // e.g., "S123456789"
  bookingStatus: BookingStatus;
  overviewStatus: string;
  agencyBookingReference?: string;
  creationDate: string;
  expirationDate?: string;      // TTL
  totalAmount: { value: number; currency: string };
  contact?: Contact;
  bookingItems: BookingItem[];
  prices: Prices;
  payments?: Payment[];
  warnings?: Warning[];
}

type BookingStatus = 
  | "CREATED" | "PREBOOKING_IN_PROGRESS" | "PREBOOKED"
  | "AUTHORIZATION_IN_PROGRESS" | "AUTHORIZED"
  | "CONFIRMATION_IN_PROGRESS" | "CONFIRMED"
  | "CAPTURE_IN_PROGRESS" | "INVOICED"
  | "CANCELLATION_IN_PROGRESS" | "CANCELED"
  | "REFUND_IN_PROGRESS" | "MODIFIED" | "REFUNDED"
  | "EXPIRED" | "ROLLBACKED" | "ROLLBACK_ERROR";
```

### 6.5 Product

```typescript
interface Product {
  type: "point-to-point" | "point-to-point-reservation" | "point-to-point-option" | "pass";
  code: string;
  label: string;
  marketingCarrier: string;
  supplier: string;
  paxType?: { code: string; label: string };
  cabinClass?: {
    code: string;
    label: string;
    comfortCategory: { code: string; label: string };
    type?: { code: "COUCHETTE" | "SLEEPER" | "SEAT"; label: string };
  };
  fare?: {
    label: string;
    flexibility: { code: string; label: string; level: string };
    conditions: string;
  };
  refundable?: "YES" | "NO" | "WITH_CONDITION";
  exchangeable?: "YES" | "NO" | "WITH_CONDITION";
}
```

---

## 7. BOOKING FLOW

### State Diagram

```
CREATED
    │ prebook
    ▼
PREBOOKING_IN_PROGRESS
    │ success
    ▼
PREBOOKED ◄──── (TTL starts)
    │ pay
    ▼
AUTHORIZATION_IN_PROGRESS
    │ authorized
    ▼
AUTHORIZED
    │ confirm
    ▼
CONFIRMATION_IN_PROGRESS
    │ confirmed
    ▼
CONFIRMED
    │ capture
    ▼
CAPTURE_IN_PROGRESS
    │ invoice
    ▼
INVOICED ───────────────────┐
    │                       │ cancel
    │ (travel completed)    ▼
    │               CANCELLATION_IN_PROGRESS
    │                       │
    │                       ▼
    │                   CANCELED
    │                       │ refund
    │                       ▼
    │               REFUND_IN_PROGRESS
    │                       │
    │               ┌───────┴───────┐
    │               ▼               ▼
    │           REFUNDED    PARTIALLY_REFUNDED

Error States: EXPIRED, ROLLBACKED, ROLLBACK_ERROR
```

### Booking Status Reference

| Status | Description | Allowed Operations |
|--------|-------------|-------------------|
| CREATED | New booking | prebook |
| PREBOOKED | Inventory reserved | prebook, pay, confirm |
| AUTHORIZED | Payment authorized | confirm |
| CONFIRMED | Carrier confirmed | - |
| INVOICED | Billed | refund |
| CANCELED | Cancelled | - |
| REFUNDED | Fully refunded | - |
| EXPIRED | TTL exceeded | - |

---

## 8. PRICES AND FEES

### Billing vs Selling

| Type | Description |
|------|-------------|
| **Billing** | Rail Europe → Partner invoice |
| **Selling** | Recommended customer price (default: EUR) |

### Commission Formula

```
amount = netAmount + partnerCommission
```

### Price Structure

```json
{
  "prices": {
    "billings": [{
      "billingPrice": {
        "amount": { "value": 424.0, "currency": "CHF" },
        "netAmount": { "value": 387.96, "currency": "CHF" }
      },
      "partnerCommission": { "amount": { "value": 36.04, "currency": "CHF" } }
    }],
    "selling": {
      "sellingPrice": { "amount": { "value": 656.66, "currency": "AUD" } },
      "partnerCommission": { "amount": { "value": 55.82, "currency": "AUD" } }
    },
    "fees": {
      "items": [{
        "label": "Booking fee",
        "price": { "billings": [{ "billingPrice": { "amount": { "value": 9.95, "currency": "EUR" } } }] }
      }]
    }
  }
}
```

### Available Selling Currencies

AED, ARS, AUD, BDT, BRL, CAD, CHF, EUR, GBP, HKD, ILS, INR, JPY, NZD, PKR, SGD, THB, USD, ZAR

**Note:** TRY not available. Contact: webservices@raileurope.com

---

## 9. PRODUCTS SCOPE

### Point-to-Point Products

| Family | Supplier | Description |
|--------|----------|-------------|
| RENFE | RENFE | Spain domestic |
| TGV/TGV InOui | SNCF | France high-speed |
| TGV Lyria | SNCF | France-Switzerland |
| Eurostar | SNCF | UK-Europe |
| TER | SNCF | France regional |
| NTV Italo | NTV | Italy private high-speed |
| DB | DB | Germany |
| ÖBB | ÖBB | Austria + Nightjet |
| Trenitalia | Trenitalia | Italy |
| SBB | SBB | Switzerland |
| RDG | RDG | UK |
| IRYO | IRYO | Spain premium |
| RegioJet | RegioJet | Czech Republic |
| Benerail | Benerail | Belgium/Benelux |

### Pass Products

- **Eurail Global** - All Europe
- **Eurail One Country** - 24+ countries
- **Swiss e-Passes** - Switzerland
- **Trenitalia Pass** - Coming soon

---

## 10. CARRIER COVERAGE

| Country | Operators |
|---------|-----------|
| Austria | ÖBB, Railjet, Nightjet |
| Belgium | SNCB, Eurostar |
| Czech Rep | ČD, RegioJet |
| France | SNCF, TGV, Eurostar |
| Germany | DB, ICE, IC |
| Italy | Trenitalia, Italo |
| Netherlands | NS, Eurostar |
| Spain | Renfe, IRYO, Ouigo |
| Switzerland | SBB, RHB |
| UK | RDG (all operators) |

---

## 11. CARRIER STARTER KITS

### Key Carriers Summary

| Carrier | Hold TTL | Grace Period | Passport Required |
|---------|----------|--------------|-------------------|
| Benerail | 1 hour | End of day | No |
| DB | 1 hour | 3 hours | No |
| Eurail | 7 days | None | No |
| Eurostar | 7 days | None | **Yes** |
| IRYO | 15 min | 24 hours | **Yes** |
| NTV Italo | 30 min | None | No |
| ÖBB | 30 min | 2 hours | No |
| SNCF TGV | 7 days | End of day | No |
| SNCF TER | 24 hours | None | No |

### Passport Data Structure (Eurostar, IRYO)

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "countryOfResidence": "FR",
  "travelerDocument": {
    "type": "PASSPORT",
    "countryCode": "FR",
    "documentNumber": "123456789",
    "expirationDate": "2030-12-31",
    "validDocument": true
  }
}
```

---

## 12. STATION CODES

Format: `COUNTRY_CODE:station_name`

| Country | Code | Examples |
|---------|------|----------|
| Austria | AT | `AT:wien_hbf` |
| Belgium | BE | `BE:brussels` |
| France | FR | `FR:paris_lyon`, `FR:paris_nord` |
| Germany | DE | `DE:berlin`, `DE:munich` |
| Italy | IT | `IT:roma_termini`, `IT:milano_centrale` |
| Netherlands | NL | `NL:amsterdam_centraal` |
| Spain | ES | `ES:madrid_atocha`, `ES:barcelona_sants` |
| Switzerland | CH | `CH:zurich`, `CH:geneva` |
| UK | GB | `GB:london_st_pancras_international` |

---

## 13. HOLD TTL & GRACE PERIOD

### Hold TTL

| Carrier | TTL |
|---------|-----|
| IRYO | 15 min |
| NTV Italo | 30 min |
| ÖBB | 30 min |
| Benerail | 1 hour |
| DB | 1 hour |
| SNCF TER | 24 hours |
| Eurail | 7 days |
| Eurostar | 7 days |
| SNCF TGV/Lyria | 7 days |

### Grace Period (Free Cancel/Exchange)

| Carrier | Grace Period |
|---------|--------------|
| RENFE, SNCF TGV, Lyria, Benerail, Ouigo Spain | End of day |
| DB | 3 hours |
| ÖBB | 2 hours |
| RDG | 1 hour |
| Trenitalia | 30 min |
| SBB PTP | 20 min |
| NTV, Eurail, IRYO, Eurostar | None |

---

## 14. TICKETING METHODS

| Method | Description | Output |
|--------|-------------|--------|
| **PAH** | Print at Home | PDF URL in `valueDocuments` |
| **TOD** | Ticket on Departure | CTR code, collect at station |
| **RETRIEVE_VIA_LINK** | Carrier website | Link to download |
| **MPASS** | Mobile Pass (Eurail) | Pass number for Rail Planner app |

---

## 15. CARRIER LOGOS

### URL Format
```
https://era.raileurope.com/assets/images/operating-carriers/{value}.svg
```

### Mapping

| marketingInformation | Logo Value |
|---------------------|------------|
| EUROSTAR_ER | EUROSTAR |
| RENFE_RENFE, RENFE_AVE | renfe |
| BENE_INTERCITY | Benerail |
| NTV_ITALO | italo |
| DISTRIBUSION_IRYO | iryo |
| DBAHN | dbahn |
| TRENITALIA_FRECCIAROSSA | trenitalia_frecciarossa |

---

## 16. TEST CREDENTIALS

| System | URL | Username | Password |
|--------|-----|----------|----------|
| ERA API | (from Rail Europe) | client_id | client_secret |
| Mock Server | stoplight.io/mocks/... | - | - |
| Eurail Test | app-builds.eurail.io/training/ | eurail | IkMagTreinen! |
| ÖBB Sandbox | (via API) | stest | f74t34rtH |

---

## 17. API CHANGE LOG

### Breaking Changes

| Date | Change | Action |
|------|--------|--------|
| 19 Mar 2025 | phoneNumber format | Use +country prefix |
| 01 Dec 2024 | URL trailing / | Remove trailing slashes |

### Deprecations

| Field | Replacement | Date |
|-------|-------------|------|
| products[].conditions | products[].fare.conditions | Dec 2024 |
| products[].flexibility | products[].fare.flexibility | Dec 2024 |
| travelers[].claimProductTypes[] | travelers[].cards[].code | Mar 2025 |

### Confirm Flow Change (Oct 2024)

```
OLD: POST /bookings/{id}/checkout/confirm
NEW: POST /bookings/{id}/checkout/confirm?printOption=PRINT_ASYNC
     THEN: POST /bookings/{id}/print
```

---

## QUICK REFERENCE

### Minimal Booking Flow

```bash
# 1. Get token
POST /oauth2/token → access_token

# 2. Search journeys
POST /offers/point-to-point/searches → offers[].location

# 3. Create booking
POST /bookings { items: [{ offerLocations: [...] }] } → bookingId

# 4. Update travelers
PUT /bookings/{id}/items/{itemId}/travelers

# 5. Prebook
POST /bookings/{id}/checkout/prebook

# 6. Confirm
POST /bookings/{id}/checkout/confirm?printOption=PRINT_ASYNC

# 7. Get tickets
POST /bookings/{id}/print → valueDocuments[].url
```

---

**Document Version:** v4 Complete with OpenAPI Specs
**Last Updated:** 25 Ocak 2026
**OpenAPI Sources:** authentication, places, point-to-point-search, passes-search, bookings, health, products
