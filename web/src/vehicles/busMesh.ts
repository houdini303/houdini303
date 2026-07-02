import * as THREE from 'three';
import type { VehicleKind } from '../api.ts';

// Low-poly 3D model vozu. Orientace: Z = nahoru, +Y = předek (směr jízdy),
// X = šířka. Rozměry v „metrech" (vrstva je pak škáluje na mapu).
// Barva karoserie = barva linky; trolejbus má navíc sběrače na střeše.

const LEN = 11; // délka (Y)
const WID = 2.55; // šířka (X)
const HGT = 2.7; // výška (Z)
const WHEEL_R = 0.55;

// sdílené geometrie (napříč instancemi)
const glassGeo = new THREE.BoxGeometry(WID + 0.02, LEN - 3.2, 1.05);
const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.35, 16);
const lightGeo = new THREE.BoxGeometry(0.5, 0.18, 0.35);
const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 4.6, 6);

const glassMat = new THREE.MeshStandardMaterial({
  color: 0x0a0f18,
  roughness: 0.15,
  metalness: 0.6,
});
const tyreMat = new THREE.MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.9 });
const headMat = new THREE.MeshStandardMaterial({
  color: 0xfff6d8,
  emissive: 0xfff0c0,
  emissiveIntensity: 0.9,
});
const tailMat = new THREE.MeshStandardMaterial({
  color: 0xff3b46,
  emissive: 0xff2530,
  emissiveIntensity: 0.8,
});
const poleMat = new THREE.MeshStandardMaterial({ color: 0x141821, roughness: 0.6, metalness: 0.4 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0xe7edf5, roughness: 0.5 });

export function buildVehicle(colorHex: string, kind: VehicleKind): THREE.Group {
  const g = new THREE.Group();
  const zBase = WHEEL_R; // karoserie sedí nad koly

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.45,
    metalness: 0.1,
  });

  // karoserie
  const body = new THREE.Mesh(new THREE.BoxGeometry(WID, LEN, HGT), bodyMat);
  body.position.set(0, 0, zBase + HGT / 2);
  g.add(body);

  // střešní pruh (světlý) pro čitelný tvar shora
  const roof = new THREE.Mesh(new THREE.BoxGeometry(WID - 0.5, LEN - 1.2, 0.12), roofMat);
  roof.position.set(0, 0, zBase + HGT + 0.02);
  g.add(roof);

  // prosklení (okenní pás kolem)
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0, 0, zBase + HGT - 0.75);
  g.add(glass);

  // světla vpředu (+Y) a vzadu (−Y)
  for (const dx of [-0.75, 0.75]) {
    const h = new THREE.Mesh(lightGeo, headMat);
    h.position.set(dx, LEN / 2 - 0.05, zBase + 0.6);
    g.add(h);
    const t = new THREE.Mesh(lightGeo, tailMat);
    t.position.set(dx, -LEN / 2 + 0.05, zBase + 0.6);
    g.add(t);
  }

  // kola
  for (const dy of [LEN / 2 - 2, -LEN / 2 + 2]) {
    for (const dx of [-WID / 2, WID / 2]) {
      const w = new THREE.Mesh(wheelGeo, tyreMat);
      w.rotation.z = Math.PI / 2; // osa podél X
      w.position.set(dx, dy, WHEEL_R);
      g.add(w);
    }
  }

  // trolejbus: dva sběrače ze střechy dozadu a nahoru
  if (kind === 'trolleybus') {
    for (const dx of [-0.5, 0.5]) {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(dx, -LEN / 2 + 2.5, zBase + HGT + 2.0);
      pole.rotation.x = -0.5; // sklon dozadu
      g.add(pole);
    }
  }

  g.rotation.order = 'ZYX';
  return g;
}
