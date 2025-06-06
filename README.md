# Campsite Streaming Server

This project is a lightweight and modular Node.js HTTP server for streaming Colorado dispersed campsite data from an LMDB store using the `lmdb-js` library. One of my favorite pastimes is camping with my dog, Willow, and all the coordinates come from spots I’ve saved on Google Maps during our adventures. 

![Willow camping](data/images/willow.jpg)

When a client sends a request to the `/campsites` endpoint, the controller first parses and validates any query parameters, such as elevation filters. It then calls the service layer, which iterates over all campsite records in the LMDB database. Each record is validated and normalized using the model before being filtered by the requested criteria. Only valid, matching campsites are yielded by the service. The controller is then responsible for starting the stream.

The streaming layer consumes these validated campsite objects one at a time, serializing each to JSON and writing it to the HTTP response as part of a single JSON array. This process is efficient and memory-friendly, as it never loads the entire dataset into memory. The server also monitors for client disconnects and handles backpressure by pausing and resuming streaming as needed, ensuring robust delivery even to slow clients.

When a client requests the `/status` endpoint, the controller immediately gathers a snapshot of the server’s health and resource usage. This includes the current uptime, CPU usage, and detailed memory statistics. The service layer collects these metrics and returns them as a structured JSON object. The response is sent directly to the client, providing real-time visibility into server performance and making it easy to integrate with monitoring tools or health checks.

## Architecture

```mermaid
flowchart TD
    A["HTTP Client"] --> B["server.js: Handles startup, routing, and seeding"]
    B -->|Seed Data| M["models/campsite.js: Data model & validation"]
    M --> D["LMDB Database: Store structured records"]
    B -->|"GET /campsites"| E["campsitesController.js: HTTP request logic"]
    E --> F["campsitesService.js: Filtering + business logic"]
    F --> M
    F -->|getRange| D
    E --> G["createCampsiteStream.js: Stream JSON with back-pressure"]
    G -->|"JSON stream chunks"| A
    B -->|"GET /status"| H["Return status, uptime and metrics"]
    H -->|"JSON"| A
```

## Getting Started

### Use Node.js v20 (via nvm)

```bash
nvm use
```

### Install Dependencies

```bash
npm install
```

### Start the server

```bash
npm start
```

The server will run at: `http://localhost:3000`


## API Endpoints

### GET `/campsites`

**Description**  
Streams all campsite records as a single JSON array. The data is sent incrementally (chunk by chunk), so you never load the entire dataset into memory at once.

**Request**  
```http
GET http://localhost:3000/campsites
```

**Query Parameters (optional)**  
- `min_elevation` (number): Return only campsites at or above this elevation (in feet).  
- `max_elevation` (number): Return only campsites at or below this elevation (in feet).  

**Request:**  
```
GET http://localhost:3000/campsites?min_elevation=9000&max_elevation=11000
```

**Response**  
A streamed JSON array of campsite objects. Each object includes the following fields:

```json
[
  {
    "id": "camp_001",
    "name": "Brainard Lake Road",
    "location": {
      "latitude": 40.0213,
      "longitude": -105.5856
    },
    "region": "Indian Peaks",
    "elevation_ft": 10400
  },
  …
]
```

### GET `/status`

**Description**  
Returns a simple health check, including server uptime and a real-time snapshot of CPU and memory usage.

**Request**  
```http
GET http://localhost:3000/status
```

**Response**  
A JSON object containing:

```json
{
  "status": "ok",
  "uptime": 12345.67,
  "metrics": {
    "cpuUsage": "2.15%",
    "memory": {
      "rss": "36.52 MB",
      "heapTotal": "9.38 MB",
      "heapUsed": "5.21 MB",
      "heapUsagePercent": "55.6%",
      "external": "18.27 MB"
    }
  }
}
```
## Data Validation

Data validation is performed at key stages in the application to ensure the integrity and consistency of the data. Before seeding, raw JSON data is validated to meet required structure and type constraints using the `Campsite.fromRaw()` method. When the data is retrieved from the database for streaming, each record is validated again to ensure it adheres to the expected format, preventing invalid or malformed data from being sent to clients.

## Metrics

The server tracks its own resource usage to provide real-time performance insights. Each time a client requests `/campsites`, the server calls `getMetrics()` immediately before and after streaming data. This function samples CPU usage over a short (100 ms) window and collects memory statistics, including resident set size (RSS), heap allocation, heap usage, heap usage percentage, and external memory, all reported in megabytes. These before-and-after metrics are logged to the console, allowing you to see the impact of streaming on server resources.

The `/status` endpoint also exposes these metrics in its JSON response, along with the server's uptime in seconds. This makes it easy to integrate the server with health checks, dashboards, or monitoring tools, and to observe resource consumption trends over time.

## Performance

To evaluate the server under load, I ran a simulated spike using 50 virtual users in Postman. The results are as follows:

![Performance metrics](data/images/performance.png)

These metrics demonstrate that, even with concurrent connections ramped up to 50 virtual users, the server sustained a steady throughput of nearly 9 req/s and maintained sub-150 ms response times for 99% of requests.

## Logging

The server logs key events for transparency and debugging:

- **Requests:** Each incoming HTTP request logs the endpoint and method.
- **Streaming:** Every campsite streamed logs its `id`, `name`, and `elevation_ft`.
- **Backpressure:** When the response buffer fills, logs `[BACKPRESSURE DETECTED]` and pauses streaming until the buffer drains, then logs `[DRAIN]` when streaming resumes.
- **Client Disconnects:** If a client closes the connection mid-stream, logs `[ABORTED] Client closed connection` and stops streaming.
- **Errors:** All unhandled errors are logged with stack traces for troubleshooting.
- **Metrics:** Before and after streaming `/campsites`, logs CPU and memory usage snapshots.

These logs provide a clear, real-time view of server activity, resource usage, and any issues encountered during operation.

## Error Handling

- **400 Bad Request:**  
  Returned when a client provides invalid query parameters (e.g., non-numeric values for `min_elevation` or `max_elevation`). The response includes a JSON error message specifying the invalid parameter.
  ```json
  { "error": "Invalid min_elevation: not_a_number" }
  ```

- **404 Not Found:**  
  Triggered when the route is unsupported or method is not GET.

- **500 Internal Server Error:**  
  If an unexpected error occurs, returns a JSON response with:
  ```json
  { "error": "Something went wrong." }
  ```

- **Client Disconnects:**  
  The server listens for client termination via `req.on('close')` and aborts the stream gracefully with log output:
  ```
  [ABORTED] Client closed connection
  ```

### Backpressure

When a client reads data slowly (for example, due to a slow network or intentional throttling), the server may encounter backpressure. This means the internal buffer for the HTTP response is full, and the server must pause sending more data until the client catches up. The server handles this by:

- Checking the return value of `res.write()`. If it returns `false`, the server waits for the `'drain'` event before resuming streaming.
- Logging backpressure events for observability.

This mechanism ensures the server does not overwhelm slow clients and always produces valid, complete JSON output, even under adverse network conditions.

## Testing

To verify that the streaming endpoint behaves exactly as intended in a real-world scenario, I used a lightweight, live‐server test suite that issues actual HTTP requests against a running server on `localhost:3000`. By launching the server and then executing npm test, we spin up a single Node.js script that sequentially fires off `GET` requests—both with and without query parameters—and simulates a throttled client to trigger back‐pressure. Each request accumulates the streamed JSON response, parses it, and asserts overall structure and content before logging a pass or fail. Because these tests connect to the server over TCP rather than invoking route handlers in isolation, they confirm end‐to‐end functionality: from URL parsing and LMDB iteration all the way through streaming, back‐pressure handling, and graceful teardown, in the exact same environment that will run in production.

To run the test suite, make sure the server is running, then run:

```bash
npm test
```

### Tests included

- `testGetAllCampsites`: Validates streaming of full dataset.
- `testFilterMinElevation`: Ensures lower bound filtering.
- `testFilterMaxElevation`: Ensures upper bound filtering.
- `testFilterElevationRange`: Validates combined elevation filters.
- `testStatusEndpoint`: Verifies server health status.
- `testClientDisconnect`: Ensures the server gracefully handles a client disconnecting mid-stream without crashing.
- `simulateSlowClient`: Simulates a throttled client to trigger backpressure.

## Manual Testing

### Using Postman

Send a `GET` request to:

```
http://localhost:3000/campsites
```

Add query parameters to test filters. You’ll receive a streamed JSON array.

### Using cURL

```bash
curl "http://localhost:3000/campsites?min_elevation=9500&max_elevation=10500"
```

To simulate a slow connection for backpressure:

```bash
curl --limit-rate 1k "http://localhost:3000/campsites"
```

With a small dataset, the server may not always log backpressure events because the Node.js HTTP response buffer is large enough to hold all the data being sent. If the entire JSON response fits into the buffer, `res.write()` will always return true, meaning the server never needs to pause and wait for the 'drain' event. As a result, the backpressure log messages will not appear.

**For example:**  
To test this, I seeded 500 campsite objects into the database. When running a slow client, I observed that backpressure was triggered and the log message appeared after streaming about 100+ campsites. This demonstrated that with a larger dataset and a slow client, the server’s backpressure handling and logging work as expected.

![Proof of logs](data/images/proof-of-logs.png)