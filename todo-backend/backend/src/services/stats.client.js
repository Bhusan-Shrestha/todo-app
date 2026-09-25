// Talks to the todo-stats microservice over the Docker Swarm internal network.
//
// "todo-stats" is the service name from docker-compose.yml. Swarm's built-in
// DNS turns that name into the address of the running containers, on whichever
// worker node they are. Nothing outside Docker can use this address.
const STATS_SERVICE_URL =
  process.env.STATS_SERVICE_URL || "http://todo-stats:5000";
const TIMEOUT_MS = Number(process.env.STATS_SERVICE_TIMEOUT_MS) || 3000;

function serviceError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function getStats(todos) {
  let response;
  try {
    response = await fetch(`${STATS_SERVICE_URL}/stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todos }),
      // Do not wait forever if the microservice is down or slow
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = (err.cause && err.cause.code) || err.name || err.message;
    console.error(`Stats service unreachable: ${reason}`);
    throw serviceError("Stats service is unavailable", 503);
  }

  if (!response.ok) {
    console.error(`Stats service returned HTTP ${response.status}`);
    throw serviceError("Stats service returned an error", 502);
  }

  return response.json();
}

module.exports = { getStats };
