export class Input {
  left = false;
  right = false;

  private space = false;
  private pause = false;
  private mute = false;
  private copy = false;
  private skip = false;
  private tap = false;

  constructor() {
    window.addEventListener("keydown", (e) => this.onKey(e, true));
    window.addEventListener("keyup", (e) => this.onKey(e, false));
    window.addEventListener("pointerdown", () => {
      this.tap = true;
    });
    window.addEventListener("blur", () => {
      this.left = false;
      this.right = false;
    });
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    const { code } = e;
    if (
      code === "ArrowLeft" ||
      code === "ArrowRight" ||
      code === "Space" ||
      code === "KeyP" ||
      code === "Escape" ||
      code === "KeyM" ||
      code === "KeyA" ||
      code === "KeyD" ||
      code === "KeyC" ||
      code === "KeyN"
    ) {
      e.preventDefault();
    }

    if (code === "ArrowLeft" || code === "KeyA") this.left = down;
    if (code === "ArrowRight" || code === "KeyD") this.right = down;

    if (!down) return;
    if (code === "Space") this.space = true;
    if (code === "KeyP" || code === "Escape") this.pause = true;
    if (code === "KeyM") this.mute = true;
    if (code === "KeyC") this.copy = true;
    if (code === "KeyN") this.skip = true;
  }

  consumeSpace(): boolean {
    const v = this.space;
    this.space = false;
    return v;
  }

  consumePause(): boolean {
    const v = this.pause;
    this.pause = false;
    return v;
  }

  consumeMute(): boolean {
    const v = this.mute;
    this.mute = false;
    return v;
  }

  consumeCopy(): boolean {
    const v = this.copy;
    this.copy = false;
    return v;
  }

  consumeSkip(): boolean {
    const v = this.skip;
    this.skip = false;
    return v;
  }

  consumeTap(): boolean {
    const v = this.tap;
    this.tap = false;
    return v;
  }
}
