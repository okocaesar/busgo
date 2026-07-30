import cities from "./cities";

import douala from "../assets/routes/douala.jpg";
import yaounde from "../assets/routes/yaounde.jpg";
import buea from "../assets/routes/buea.jpg";
import bamenda from "../assets/routes/bamenda.jpg";

const images = [douala, yaounde, buea, bamenda];

const busTypes = [
  "Express",
  "VIP",
  "Standard",
  "Luxury",
];

// Approximate coordinates
const cityCoordinates = {
  Mamfe: { lat: 5.75, lng: 9.31 },
  Douala: { lat: 4.05, lng: 9.70 },
  Yaoundé: { lat: 3.87, lng: 11.52 },
  Buea: { lat: 4.15, lng: 9.24 },
  Bamenda: { lat: 5.96, lng: 10.15 },
  Bafoussam: { lat: 5.48, lng: 10.42 },
  Garoua: { lat: 9.30, lng: 13.40 },
  Maroua: { lat: 10.59, lng: 14.32 },
  Ngaoundéré: { lat: 7.32, lng: 13.58 },
  Bertoua: { lat: 4.58, lng: 13.68 },
  Ebolowa: { lat: 2.92, lng: 11.15 },
  Limbe: { lat: 4.02, lng: 9.21 },
  Kribi: { lat: 2.94, lng: 9.91 },
  Kumba: { lat: 4.64, lng: 9.45 },
  Dschang: { lat: 5.44, lng: 10.06 },
};

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return Math.round(
    R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
  );
}

function getDuration(distance) {
  const totalMinutes = Math.round(distance);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

function getPrice(distance) {
  let price = 1500 + distance * 16;

  return Math.round(price / 500) * 500;
}

const routes = [];

let id = 1;

cities.forEach((from) => {
  cities.forEach((to) => {
    if (from === to) return;

    const fromCoords = cityCoordinates[from];
    const toCoords = cityCoordinates[to];

    const distance = getDistance(
      fromCoords.lat,
      fromCoords.lng,
      toCoords.lat,
      toCoords.lng
    );

    routes.push({
      id: id++,
      from,
      to,
      distance,
      duration: getDuration(distance),
      price: getPrice(distance),
      image: images[Math.floor(Math.random() * images.length)],
      type: busTypes[Math.floor(Math.random() * busTypes.length)],
    });
  });
});

console.log("Generated routes:", routes.length);

export default routes;