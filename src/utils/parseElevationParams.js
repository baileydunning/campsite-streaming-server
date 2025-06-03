export function parseElevationParams(searchParams) {
  const rawMin = searchParams.get("min_elevation");
  const rawMax = searchParams.get("max_elevation");

  const minElevation = rawMin == null ? null : parseInt(rawMin, 10);
  const maxElevation = rawMax == null ? null : parseInt(rawMax, 10);

  const isValid =
    (rawMin == null || !isNaN(minElevation)) &&
    (rawMax == null || !isNaN(maxElevation));

  return {
    isValid,
    minElevation,
    maxElevation,
    errorMessage: !isValid
      ? `Invalid elevation parameters: ${
          isNaN(minElevation) ? `min_elevation=${rawMin}` : ""
        } ${isNaN(maxElevation) ? `max_elevation=${rawMax}` : ""}`.trim()
      : null,
  };
}
