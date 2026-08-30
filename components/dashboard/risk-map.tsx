"use client";

import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { pointColorExpression, toFeatureCollection } from "@/lib/fireline/map-data";
import type { Hotspot, RiskLens } from "@/lib/fireline/types";

interface RiskMapProps {
  rows: Hotspot[];
  lens: RiskLens;
  selectedId: number | null;
  onSelect(hotspot: Hotspot): void;
  onBasemapError(): void;
}

export function RiskMap({ rows, lens, selectedId, onSelect, onBasemapError }: RiskMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const rowsRef = useRef(rows);
  const selectRef = useRef(onSelect);
  const errorRef = useRef(onBasemapError);
  const [ready, setReady] = useState(false);

  useEffect(() => { rowsRef.current = rows; }, [rows]);
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { errorRef.current = onBasemapError; }, [onBasemapError]);

  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [113.2, 0.2],
      zoom: 4.1,
      maxBounds: [[106, -6], [121, 7]],
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", () => errorRef.current());
    map.on("load", () => {
      map.addSource("hotspots", {
        type: "geojson",
        data: toFeatureCollection(rowsRef.current),
        cluster: true,
        clusterRadius: 44,
        clusterMaxZoom: 10,
      });
      map.addLayer({
        id: "clusters", type: "circle", source: "hotspots", filter: ["has", "point_count"],
        paint: {
          "circle-color": "#405B57",
          "circle-radius": ["step", ["get", "point_count"], 17, 100, 23, 1000, 31],
          "circle-stroke-color": "#F7FAF9",
          "circle-stroke-width": 2,
          "circle-opacity": 0.92,
        },
      });
      map.addLayer({
        id: "cluster-count", type: "symbol", source: "hotspots", filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["Noto Sans Regular"] },
        paint: { "text-color": "#FFFFFF" },
      });
      map.addLayer({
        id: "critical-halo", type: "circle", source: "hotspots",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "riskTier"], "Kritis"]],
        paint: { "circle-radius": 10, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#8F1D2C", "circle-stroke-width": 3 },
      });
      map.addLayer({
        id: "points", type: "circle", source: "hotspots", filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": pointColorExpression("priority"),
          "circle-radius": ["match", ["get", "riskTier"], "Kritis", 7.5, "Tinggi", 6.5, "Sedang", 5.5, 4.5],
          "circle-opacity": ["match", ["get", "riskTier"], "Rendah", 0.24, 0.84],
          "circle-stroke-color": ["match", ["get", "riskTier"], "Rendah", "#267266", "#FFFFFF"],
          "circle-stroke-width": ["match", ["get", "riskTier"], "Rendah", 2, 1],
        },
      });
      map.addLayer({
        id: "selected", type: "circle", source: "hotspots",
        filter: ["==", ["get", "id"], -1],
        paint: { "circle-radius": 13, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#FFFFFF", "circle-stroke-width": 4 },
      });
      map.on("click", "clusters", async (event) => {
        const feature = event.features?.[0];
        const clusterId = Number(feature?.properties?.cluster_id);
        const source = map.getSource("hotspots") as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        if (feature?.geometry.type === "Point") map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom });
      });
      map.on("click", "points", (event) => {
        const id = Number(event.features?.[0]?.properties?.id);
        const hotspot = rowsRef.current.find((row) => row.id === id);
        if (hotspot) selectRef.current(hotspot);
      });
      for (const layer of ["clusters", "points"]) {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
      }
      setReady(true);
    });
    return () => { setReady(false); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (ready) (mapRef.current?.getSource("hotspots") as GeoJSONSource | undefined)?.setData(toFeatureCollection(rows));
  }, [ready, rows]);
  useEffect(() => {
    if (ready) mapRef.current?.setPaintProperty("points", "circle-color", pointColorExpression(lens));
  }, [lens, ready]);
  useEffect(() => {
    if (ready) mapRef.current?.setFilter("selected", ["==", ["get", "id"], selectedId ?? -1]);
  }, [ready, selectedId]);

  return <div ref={container} className="map-canvas" role="region" aria-label="Peta anomali termal FIRMS" aria-describedby="map-summary" />;
}
