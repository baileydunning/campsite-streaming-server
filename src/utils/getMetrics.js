export async function getMetrics(sampleDurationMs = 100) {
  // Record CPU usage at the start of the sampling interval
  const startCpuUsage = process.cpuUsage();
  // Record high-resolution timestamp at the start
  const startHrTime = process.hrtime.bigint();

  // Pause for the sampling duration
  await new Promise((resolve) => setTimeout(resolve, sampleDurationMs));

  // Compute CPU usage difference since start
  const cpuUsageDiff = process.cpuUsage(startCpuUsage);
  // Calculate elapsed time in milliseconds
  const elapsedMs = Number(process.hrtime.bigint() - startHrTime) / 1e6;
  // Total CPU time spent (user + system) in milliseconds
  const totalCpuTimeMs = (cpuUsageDiff.user + cpuUsageDiff.system) / 1000;
  // CPU usage as a percentage over the sampling window
  const cpuUsagePercent = ((totalCpuTimeMs / elapsedMs) * 100).toFixed(2) + "%";

  // Retrieve current memory usage stats
  const {
    rss: residentSetSizeBytes,
    heapTotal: heapAllocatedBytes,
    heapUsed: heapUsedBytes,
    external: externalBytes,
  } = process.memoryUsage();

  // Convert bytes to megabytes with two decimal places
  const bytesToMB = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";
  // Percentage of V8 heap in use
  const heapUsagePercent =
    ((heapUsedBytes / heapAllocatedBytes) * 100).toFixed(1) + "%";

  return {
    cpuUsage: cpuUsagePercent,
    memory: {
      rss: bytesToMB(residentSetSizeBytes),
      heapTotal: bytesToMB(heapAllocatedBytes),
      heapUsed: bytesToMB(heapUsedBytes),
      heapUsagePercent,
      external: bytesToMB(externalBytes),
    },
  };
}
