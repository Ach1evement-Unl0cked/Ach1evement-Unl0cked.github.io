// This file was originally over 4,000 lines of code.
// Confidential and Proprietary information has been removed.

// This source code is owned by Mason Ellington

document.addEventListener("DOMContentLoaded", function () {
  const element = document.getElementById("outage-map");
  if (!element) return;
  const status = document.getElementById("map-status");
  function report(message) {
    if (status) status.textContent += " " + message;
  }
  if (typeof L === "undefined") {
    report("The map library could not load.");
    return;
  }

  const map = L.map(element, { maxZoom: 19 });
  const baseMap = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ).addTo(map);
  baseMap.once("tileerror", function () {
    report(
      "OpenStreetMap tiles could not load. Check your internet connection.",
    );
  });

  function popup(title, description) {
    const container = document.createElement("div");
    const heading = document.createElement("strong");
    heading.textContent = title;
    const text = document.createElement("p");
    text.textContent = description;
    container.append(heading, text);
    return container;
  }

  const serviceAreas = L.geoJSON(null, {
    style: function (feature) {
      const colors = { REC: "#2f6f5e", Municipal: "#234a75" };
      return {
        color: colors[feature.properties?.ESB_Type] || "#7958a5",
        weight: 2,
        fillOpacity: 0.12,
      };
    },
    onEachFeature: function (feature, layer) {
      const properties = feature.properties || {};
      layer.bindPopup(
        popup(
          properties.Owner || "IUC Service Area",
          properties.ESB_Type || "Electric service area",
        ),
      );
    },
  }).addTo(map);

  // Fictional demonstration areas; these are not actual utility boundaries.
  const testAreas = L.featureGroup([
    L.polygon(
      [
        [41.045, -92.445],
        [41.045, -92.405],
        [41.02, -92.405],
        [41.02, -92.445],
      ],
      { color: "#b7791f", weight: 2, fillOpacity: 0.2 },
    ).bindPopup(popup("Ottumwa test area", "Fictional sample boundary.")),
    L.polygon(
      [
        [40.765, -92.435],
        [40.765, -92.395],
        [40.74, -92.395],
        [40.74, -92.435],
      ],
      { color: "#b7791f", weight: 2, fillOpacity: 0.2 },
    ).bindPopup(popup("Bloomfield test area", "Fictional sample boundary.")),
  ]).addTo(map);

  // Test Data
  const locations = [
    { name: "Ottumwa test location 1", lat: 41.016, lon: -92.408 },
    { name: "Ottumwa test location 2", lat: 41.038, lon: -92.43 },
    { name: "Ottumwa test location 3", lat: 41.005, lon: -92.445 },
    { name: "Bloomfield test location 1", lat: 40.752, lon: -92.414 },
    { name: "Bloomfield test location 2", lat: 40.772, lon: -92.4 },
    { name: "Bloomfield test location 3", lat: 40.738, lon: -92.435 },
  ];
  const testLocations = L.featureGroup().addTo(map);
  locations.forEach(function (location) {
    L.marker([location.lat, location.lon], { title: location.name })
      .bindPopup(
        popup(location.name, "Fictional test data, not a real utility asset."),
      )
      .addTo(testLocations);
  });

  L.control
    .layers(
      { OpenStreetMap: baseMap },
      {
        "IUC Service Area": serviceAreas,
        "Test areas (fictional)": testAreas,
        "Test locations (fictional)": testLocations,
      },
      { collapsed: false },
    )
    .addTo(map);
  L.control.scale({ imperial: true, metric: true }).addTo(map);
  map.fitBounds(testLocations.getBounds(), { padding: [35, 35], maxZoom: 11 });

  fetch("/assets/data/iuc.geojson")
    .then(function (response) {
      if (!response.ok)
        throw new Error("IUC request failed: " + response.status);
      return response.json();
    })
    .then(function (data) {
      if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
        throw new Error("Expected an IUC GeoJSON FeatureCollection.");
      }
      serviceAreas.addData(data);
    })
    .catch(function (error) {
      console.error(error);
      report("IUC Service Area could not load.");
    });
});
