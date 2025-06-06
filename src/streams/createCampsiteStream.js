export function createCampsiteStream(filtered, res, req) {
  let aborted = false;
  let index = 0;

  // Listen for the client closing the connection (e.g., navigating away or canceling)
  req.on("close", () => {
    aborted = true;
    console.log("[ABORTED] Client closed connection");
  });

  // Send the HTTP status and headers, then start an open JSON array.
  res.writeHead(200, { "Content-Type": "application/json" });
  res.write("[");

  (async () => {
    try {
      // Iterate over the filtered campsites and send them as JSON chunks
      for (const { value } of filtered) {
        if (!value) {
          console.warn("[WARN] Skipping undefined or invalid campsite value");
          continue;
        }

        if (aborted) {
          console.log("[ABORTED] Stopping stream due to client disconnect");
          break;
        }

        // Use a prefix for the first chunk to ensure valid JSON array format
        const prefix = index++ > 0 ? "," : "";

        try {
          // Serialize the campsite object as JSON
          const chunk = prefix + JSON.stringify(value.toJSON());
          if (!chunk) {
            console.warn("[WARN] Empty chunk for campsite:", value.id);
            continue; // Skip empty chunks
          }

          // Write the chunk to the response buffer
          const ok = res.write(chunk);
          console.log(
            `[STREAM] Sending ${value.id}, ${value.name} (${value.elevation_ft} ft)`
          );

          if (!ok) {
            // If `res.write()` returned false, it means Node’s internal buffer is full.
            // We’ve hit backpressure: we must wait for the socket to drain before writing more.
            console.log(
              "[BACKPRESSURE DETECTED] write() returned false → waiting for socket drain event"
            );

            // Wait until either:
            //  - the socket’s “drain” event fires (buffer cleared), OR
            //  - the client disconnects
            await new Promise((resolve) => {
              res.socket.once("drain", resolve); // Wait for drain event
              req.once("close", resolve); // Wait for client disconnect
            });

            // If the client hasn’t disconnected, we can resume streaming
            if (!aborted) {
              console.log(
                "[DRAIN] Server socket buffer emptied → resuming writes"
              );
            }
          }
        } catch (err) {
          console.error(
            `[ERROR] Failed to serialize or send data for campsite: ${err.message}`
          );
          // If serialization fails, we log the error but continue processing other campsites
        }
      }
    } catch (err) {
      console.error(
        `[ERROR] Unexpected error during campsite stream: ${err.message}`
      );
    } finally {
      // Ensure that we close the JSON array and end the response cleanly
      if (!aborted) {
        res.end("]");
        console.log("[STREAM] Streaming complete.");
      } else {
        console.log("[STREAM] Stream aborted.");
      }
    }
  })();
}
