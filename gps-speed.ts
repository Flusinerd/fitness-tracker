/**
 * Calculate the distance between two points in meters
 * @param lat1 latitude of point 1
 * @param lon1 longitude of point 1
 * @param lat2 latitude of point 2
 * @param lon2 longitude of point 2
 * @returns distance in meters
 */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  // distance between latitudes and longitudes
  const dLat = (lat2 - lat1) * Math.PI / 180.0
  const dLon = (lon2 - lon1) * Math.PI / 180.0

  // convert to radians
  lat1 = (lat1) * Math.PI / 180.0
  lat2 = (lat2) * Math.PI / 180.0

  // apply formulae
  const a = Math.pow(Math.sin(dLat / 2), 2) +
    Math.pow(Math.sin(dLon / 2), 2) *
    Math.cos(lat1) *
    Math.cos(lat2)
  const rad = 6371
  const c = 2 * Math.asin(Math.sqrt(a))
  return rad * c * 1000
}