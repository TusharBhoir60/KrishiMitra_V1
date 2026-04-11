export const districtDistances = {
  "Ahmednagar-Nashik": 115,
  "Ahmednagar-Pune": 120,
  "Aurangabad-Nashik": 110,
  "Aurangabad-Pune": 235,
  "Kolhapur-Mumbai": 375,
  "Kolhapur-Pune": 230,
  "Latur-Pune": 370,
  "Mumbai-Nashik": 170,
  "Mumbai-Pune": 150,
  "Nagpur-Amravati": 155,
  "Nagpur-Pune": 730,
  "Nashik-Pune": 210,
  "Nashik-Thane": 155,
  "Pune-Satara": 115,
  "Pune-Solapur": 245,
  "Pune-Thane": 140,
  "Raigad-Mumbai": 60,
  "Ratnagiri-Mumbai": 330,
  "Sangli-Pune": 225,
  "Satara-Kolhapur": 120,
  "Solapur-Latur": 125
};

export function getDistance(districtA, districtB) {
  const normalize = (s) => s.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  const a = normalize(districtA);
  const b = normalize(districtB);
  if (a === b) return 10;
  const key = [a, b].sort().join("-");
  return districtDistances[key] ?? null;
}

