/**
 * Lightweight Verlet physics engine for floating 3D objects.
 * Each body has position, prevPosition (velocity implicit), and constraints.
 */

import * as THREE from 'three';

class PhysicsBody {
  constructor(mesh, opts = {}) {
    this.mesh = mesh;
    this.pos = mesh.position.clone();
    this.prevPos = this.pos.clone();
    this.basePos = this.pos.clone();
    this.damping = opts.damping ?? 0.92;
    this.springForce = opts.springForce ?? 0.02;
    this.mass = opts.mass ?? 1.0;
    this.pinned = opts.pinned ?? false;
  }

  step(dt) {
    if (this.pinned) return;
    const vel = this.pos.clone().sub(this.prevPos).multiplyScalar(this.damping);
    this.prevPos.copy(this.pos);
    this.pos.add(vel);

    // Spring back to base
    const toBase = this.basePos.clone().sub(this.pos).multiplyScalar(this.springForce);
    this.pos.add(toBase);

    this.mesh.position.copy(this.pos);
  }

  applyForce(force) {
    if (this.pinned) return;
    this.pos.add(force.clone().divideScalar(this.mass));
  }

  applyAttraction(target, strength, maxDist = Infinity) {
    const dir = target.clone().sub(this.pos);
    const dist = dir.length();
    if (dist > maxDist || dist < 0.001) return;
    const force = dir.normalize().multiplyScalar(strength / (dist * dist + 0.5));
    this.applyForce(force);
  }

  applyRepulsion(source, strength, radius) {
    const dir = this.pos.clone().sub(source);
    const dist = dir.length();
    if (dist > radius || dist < 0.001) return;
    const force = dir.normalize().multiplyScalar(strength * (1.0 - dist / radius));
    this.applyForce(force);
  }
}

export class PhysicsWorld {
  constructor() {
    this.bodies = [];
  }

  addBody(mesh, opts) {
    const body = new PhysicsBody(mesh, opts);
    this.bodies.push(body);
    return body;
  }

  step(dt) {
    const clamped = Math.min(dt, 0.05);
    for (const body of this.bodies) {
      body.step(clamped);
    }
  }

  attractAll(target, strength, maxDist) {
    for (const body of this.bodies) {
      body.applyAttraction(target, strength, maxDist);
    }
  }

  repulseAll(source, strength, radius) {
    for (const body of this.bodies) {
      body.applyRepulsion(source, strength, radius);
    }
  }

  clear() {
    this.bodies = [];
  }
}

export { PhysicsBody };
