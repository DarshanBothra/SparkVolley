import { POWERUP_META, type PowerupKind } from "../entities/powerup.ts";

export type EffectHud = { name: string; color: string; remaining: number };

export class Effects {
  slow = 0;
  freeze = 0;
  aegis = 0;

  get gravityMul(): number {
    return this.slow > 0 ? 0.42 : 1;
  }

  get speedScale(): number {
    return this.slow > 0 ? 0.55 : 1;
  }

  get frozen(): boolean {
    return this.freeze > 0;
  }

  get hasAegis(): boolean {
    return this.aegis > 0;
  }

  update(dt: number): void {
    this.slow = Math.max(0, this.slow - dt);
    this.freeze = Math.max(0, this.freeze - dt);
    this.aegis = Math.max(0, this.aegis - dt);
  }

  reset(): void {
    this.slow = 0;
    this.freeze = 0;
    this.aegis = 0;
  }

  apply(kind: PowerupKind): void {
    const meta = POWERUP_META[kind];
    if (kind === "slow") this.slow = meta.duration;
    if (kind === "freeze") this.freeze = meta.duration;
    if (kind === "aegis") this.aegis = meta.duration;
  }

  hud(): EffectHud[] {
    const list: EffectHud[] = [];
    if (this.slow > 0) {
      list.push({ name: POWERUP_META.slow.name, color: POWERUP_META.slow.color, remaining: this.slow });
    }
    if (this.freeze > 0) {
      list.push({
        name: POWERUP_META.freeze.name,
        color: POWERUP_META.freeze.color,
        remaining: this.freeze,
      });
    }
    if (this.aegis > 0) {
      list.push({
        name: POWERUP_META.aegis.name,
        color: POWERUP_META.aegis.color,
        remaining: this.aegis,
      });
    }
    return list;
  }
}
