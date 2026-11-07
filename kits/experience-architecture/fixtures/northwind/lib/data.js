export const customers = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Vandelay', 'Stark Ltd', 'Wayne Co', 'Soylent', 'Tyrell', 'Cyberdyne', 'Wonka'][i],
  plan: i % 3 === 0 ? 'Enterprise' : 'Team',
  archived: i > 9,
}));

export const orders = Array.from({ length: 60 }, (_, i) => ({
  id: String(1000 + i),
  customerId: String((i % 12) + 1),
  status: ['open', 'shipped', 'closed'][i % 3],
  total: 120 + ((i * 37) % 900),
}));

export const revenue = [
  { month: 'Jul', amount: 42000 }, { month: 'Aug', amount: 45500 },
  { month: 'Sep', amount: 51200 }, { month: 'Oct', amount: 49800 },
];

export const team = [
  { name: 'Dana Ruiz', role: 'Owner' }, { name: 'Lee Park', role: 'Admin' }, { name: 'Sam Okafor', role: 'Member' },
];
