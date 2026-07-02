import maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import type { Vehicle } from '../api.ts';
import { buildVehicle } from './busMesh.ts';
import { lineColor } from './color.ts';
import { bearing, distanceMeters, lerp } from './geo.ts';
import { createVehicleLabel, type VehicleLabelEl } from './marker.ts';

// Velikost vozu držíme ~konstantní na obrazovce (jako Uber/Bolt) přes
// zoom-kompenzaci: efektivní měřítko × 2^(ZREF − zoom).
const SIZE_K = 6.5;
const ZREF = 15;
const GLIDE_MS = 9_500; // plynulý přejezd mezi updaty
const MIN_MOVE_M = 8; // anti-jitter práh pro azimut
const ROT_EASE = 0.16; // rychlost dorotování k cíli
const DEG2RAD = Math.PI / 180;

interface Item {
  group: THREE.Group;
  label: maplibregl.Marker;
  labelEl: VehicleLabelEl;
  startLng: number;
  startLat: number;
  targetLng: number;
  targetLat: number;
  startTime: number;
  curBearing: number;
  targetBearing: number;
  hasBearing: boolean;
}

// Renderuje živé vozy jako skutečné 3D modely (Three.js) přes MapLibre custom
// layer — vozy stojí na mapě, naklánějí se s perspektivou kamery a rotují dle
// azimutu. Nad každým plave HTML štítek s číslem linky.
export class Vehicles3D {
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private renderer: THREE.WebGLRenderer | null = null;
  private items = new Map<string, Item>();
  private selectedId: string | null = null;

  constructor(
    private map: maplibregl.Map,
    private onSelect?: (v: Vehicle) => void,
  ) {
    this.scene.add(new THREE.AmbientLight(0xbfd0e6, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(0.4, -0.8, 1).normalize();
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x88aaff, 0.5);
    fill.position.set(-0.5, 0.6, 0.4).normalize();
    this.scene.add(fill);
  }

  get layer(): maplibregl.CustomLayerInterface {
    return {
      id: 'vehicles-3d',
      type: 'custom',
      renderingMode: '3d',
      onAdd: (map, gl) => {
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl as WebGLRenderingContext,
          antialias: true,
        });
        this.renderer.autoClear = false;
      },
      render: (_gl, args) => {
        // MapLibre v4 předává matici (Float32Array); v5+ objekt s projekcí.
        const proj = (args as { defaultProjectionData?: { mainMatrix: number[] } })
          ?.defaultProjectionData;
        const matrix = proj ? proj.mainMatrix : (args as unknown as ArrayLike<number>);
        this.render(matrix);
      },
    };
  }

  private render(matrix: ArrayLike<number>) {
    if (!this.renderer) return;
    this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix as number[]);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
  }

  // Sesouhlasení s daty: přidat / posunout cíl / odebrat vozy.
  sync(vehicles: Vehicle[]) {
    const now = performance.now();
    const seen = new Set<string>();

    for (const v of vehicles) {
      seen.add(v.id);
      const it = this.items.get(v.id);
      if (it) {
        it.startLng = currentLng(it, now);
        it.startLat = currentLat(it, now);
        it.startTime = now;
        if (distanceMeters(it.startLng, it.startLat, v.lon, v.lat) > MIN_MOVE_M) {
          it.targetBearing = bearing(it.startLng, it.startLat, v.lon, v.lat);
          if (!it.hasBearing) it.curBearing = it.targetBearing;
          it.hasBearing = true;
        }
        it.targetLng = v.lon;
        it.targetLat = v.lat;
      } else {
        this.addItem(v, now);
      }
    }

    for (const [id, it] of this.items) {
      if (!seen.has(id)) {
        this.scene.remove(it.group);
        it.label.remove();
        this.items.delete(id);
        if (this.selectedId === id) this.selectedId = null;
      }
    }
  }

  private addItem(v: Vehicle, now: number) {
    const group = buildVehicle(lineColor(v.line), v.kind);
    this.scene.add(group);

    const labelEl = createVehicleLabel(v.line, v.kind);
    const onClick = (e: Event) => {
      e.stopPropagation();
      this.select(v.id);
      this.map.flyTo({
        center: [v.lon, v.lat],
        zoom: Math.max(this.map.getZoom(), 16),
        duration: 900,
      });
      this.onSelect?.(v);
    };
    labelEl.root.addEventListener('click', onClick);
    const label = new maplibregl.Marker({ element: labelEl.root, anchor: 'center', offset: [0, -30] })
      .setLngLat([v.lon, v.lat])
      .addTo(this.map);

    this.items.set(v.id, {
      group,
      label,
      labelEl,
      startLng: v.lon,
      startLat: v.lat,
      targetLng: v.lon,
      targetLat: v.lat,
      startTime: now,
      curBearing: 0,
      targetBearing: 0,
      hasBearing: false,
    });
  }

  // Per-frame: interpolace polohy i rotace → matice modelu + poloha štítku.
  tick(now: number) {
    const zoomFactor = SIZE_K * Math.pow(2, ZREF - this.map.getZoom());
    for (const it of this.items.values()) {
      const lng = currentLng(it, now);
      const lat = currentLat(it, now);

      if (it.hasBearing) {
        const diff = ((it.targetBearing - it.curBearing + 540) % 360) - 180;
        if (Math.abs(diff) > 0.3) it.curBearing += diff * ROT_EASE;
      }
      setModelMatrix(it.group, lng, lat, it.curBearing, zoomFactor);
      it.label.setLngLat([lng, lat]);
    }
    if (this.items.size) this.map.triggerRepaint();
  }

  private select(id: string) {
    if (this.selectedId && this.selectedId !== id) {
      this.items.get(this.selectedId)?.labelEl.setSelected(false);
    }
    this.selectedId = id;
    this.items.get(id)?.labelEl.setSelected(true);
  }

  dispose() {
    for (const it of this.items.values()) {
      this.scene.remove(it.group);
      it.label.remove();
    }
    this.items.clear();
    if (this.map.getLayer('vehicles-3d')) this.map.removeLayer('vehicles-3d');
    this.renderer = null;
  }
}

function progress(it: Item, now: number): number {
  return Math.min(1, (now - it.startTime) / GLIDE_MS);
}
function currentLng(it: Item, now: number): number {
  return lerp(it.startLng, it.targetLng, progress(it, now));
}
function currentLat(it: Item, now: number): number {
  return lerp(it.startLat, it.targetLat, progress(it, now));
}

function setModelMatrix(
  group: THREE.Group,
  lng: number,
  lat: number,
  bearingDeg: number,
  zoomFactor: number,
) {
  const merc = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 0);
  const scale = merc.meterInMercatorCoordinateUnits() * zoomFactor;
  // +Y modelu = předek; mercator sever = −Y → rot = π + azimut
  group.position.set(merc.x, merc.y, merc.z);
  group.scale.setScalar(scale);
  group.rotation.set(0, 0, Math.PI + bearingDeg * DEG2RAD);
}
