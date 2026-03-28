const DISTRICT_DISTANCES = {
  'Ahmednagar-Nashik': 115,
  'Ahmednagar-Pune': 120,
  'Aurangabad-Nashik': 110,
  'Aurangabad-Pune': 235,
  'Kolhapur-Mumbai': 375,
  'Kolhapur-Pune': 230,
  'Latur-Pune': 370,
  'Mumbai-Nashik': 170,
  'Mumbai-Pune': 150,
  'Nagpur-Amravati': 155,
  'Nagpur-Pune': 730,
  'Nashik-Pune': 210,
  'Nashik-Thane': 155,
  'Pune-Satara': 115,
  'Pune-Solapur': 245,
  'Pune-Thane': 140,
  'Raigad-Mumbai': 60,
  'Ratnagiri-Mumbai': 330,
  'Sangli-Pune': 225,
  'Satara-Kolhapur': 120,
  'Solapur-Latur': 125,
};

const normalize = (s) =>
  s
    ?.trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || '';

export function getDistanceKm(districtA, districtB) {
  const a = normalize(districtA);
  const b = normalize(districtB);
  if (!a || !b) return null;
  if (a === b) return 10;
  const key = [a, b].sort().join('-');
  return DISTRICT_DISTANCES[key] ?? 200; // default 200 km if route not listed
}

// ₹50 base + ₹2/km + ₹1/kg, minimum ₹100
export function calcTransportCost(fromDistrict, toDistrict, quantityKg) {
  const km = getDistanceKm(fromDistrict, toDistrict);
  if (km === null) return 0;
  return Math.max(100, Math.round(50 + km * 2 + quantityKg * 1));
}

export function estimatedDays(km) {
  if (km <= 50) return '1–2';
  if (km <= 200) return '2–3';
  if (km <= 500) return '3–5';
  return '5–7';
}
