export class Input {
  left = false;
  right = false;

  private space = false;
  private pause = false;
  private menu = false;
  private mute = false;
  private copy = false;
  private skip = false;
  private tap = false;
  private settings = false;
  private rules = false;
  private navLeft = false;
  private navRight = false;
  private navUp = false;
  private navDown = false;

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
      code === "ArrowUp" ||
      code === "ArrowDown" ||
      code === "Space" ||
      code === "KeyP" ||
      code === "Escape" ||
      code === "KeyM" ||
      code === "KeyA" ||
      code === "KeyD" ||
      code === "KeyC" ||
      code === "KeyN" ||
      code === "KeyS" ||
      code === "KeyR"
    ) {
      e.preventDefault();
    }

    if (code === "ArrowLeft" || code === "KeyA") this.left = down;
    if (code === "ArrowRight" || code === "KeyD") this.right = down;

    if (!down) return;
    if (code === "Space") this.space = true;
    if (code === "KeyP") this.pause = true;
    if (code === "Escape") this.menu = true;
    if (code === "KeyM") this.mute = true;
    if (code === "KeyC") this.copy = true;
    if (code === "KeyN") this.skip = true;
    if (code === "KeyS") this.settings = true;
    if (code === "KeyR") this.rules = true;
    if (code === "ArrowLeft" || code === "KeyA") this.navLeft = true;
    if (code === "ArrowRight" || code === "KeyD") this.navRight = true;
    if (code === "ArrowUp") this.navUp = true;
    if (code === "ArrowDown") this.navDown = true;
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

  consumeMenu(): boolean {
    const v = this.menu;
    this.menu = false;
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

  consumeSettings(): boolean {
    const v = this.settings;
    this.settings = false;
    return v;
  }

  consumeRules(): boolean {
    const v = this.rules;
    this.rules = false;
    return v;
  }

  consumeNavLeft(): boolean {
    const v = this.navLeft;
    this.navLeft = false;
    return v;
  }

  consumeNavRight(): boolean {
    const v = this.navRight;
    this.navRight = false;
    return v;
  }

  consumeNavUp(): boolean {
    const v = this.navUp;
    this.navUp = false;
    return v;
  }

  consumeNavDown(): boolean {
    const v = this.navDown;
    this.navDown = false;
    return v;
  }
}
