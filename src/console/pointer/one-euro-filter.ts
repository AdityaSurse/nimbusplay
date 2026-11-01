/**
 * NimbusPlay — One Euro (1€) Adaptive Low-Pass Filter
 * Eliminates jitter at rest while preserving instantaneous response during rapid swipes.
 * Based on Casiez et al., CHI 2012.
 */

export class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  public filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
    } else {
      this.s = alpha * value + (1.0 - alpha) * this.s!;
      this.y = this.s;
    }
    return this.y;
  }

  public filterWithAlpha(value: number, alpha: number): number {
    return this.filter(value, alpha);
  }

  public hasLastRawValue(): boolean {
    return this.y !== null;
  }

  public lastRawValue(): number {
    return this.y ?? 0;
  }

  public reset(): void {
    this.y = null;
    this.s = null;
  }

  public set(value: number): void {
    this.y = value;
    this.s = value;
  }
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter: LowPassFilter = new LowPassFilter();
  private dxFilter: LowPassFilter = new LowPassFilter();

  constructor(minCutoff = 1.2, beta = 0.008, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  public setParameters(minCutoff: number, beta: number, dCutoff = 1.0): void {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  public filter(value: number, dtSeconds: number): number {
    // If no previous value, initialize
    if (!this.xFilter.hasLastRawValue() || dtSeconds <= 0) {
      this.xFilter.set(value);
      this.dxFilter.set(0);
      return value;
    }

    // 1. Calculate and filter derivative (velocity)
    const prevX = this.xFilter.lastRawValue();
    const dx = (value - prevX) / dtSeconds;
    const edx = this.dxFilter.filterWithAlpha(dx, this.computeAlpha(this.dCutoff, dtSeconds));

    // 2. Dynamic cutoff frequency based on movement speed
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    // 3. Filter position with dynamic cutoff
    return this.xFilter.filterWithAlpha(value, this.computeAlpha(cutoff, dtSeconds));
  }

  public reset(initialValue?: number): void {
    if (initialValue !== undefined) {
      this.xFilter.set(initialValue);
      this.dxFilter.set(0);
    } else {
      this.xFilter.reset();
      this.dxFilter.reset();
    }
  }

  private computeAlpha(rate: number, dt: number): number {
    const tau = 1.0 / (2.0 * Math.PI * rate);
    return 1.0 / (1.0 + tau / dt);
  }
}

export class OneEuroFilter2D {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;

  constructor(minCutoff = 1.2, beta = 0.008, dCutoff = 1.0) {
    this.xFilter = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.yFilter = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  public setParameters(minCutoff: number, beta: number, dCutoff = 1.0): void {
    this.xFilter.setParameters(minCutoff, beta, dCutoff);
    this.yFilter.setParameters(minCutoff, beta, dCutoff);
  }

  public filter(x: number, y: number, dtSeconds: number): { x: number; y: number } {
    return {
      x: this.xFilter.filter(x, dtSeconds),
      y: this.yFilter.filter(y, dtSeconds)
    };
  }

  public reset(x?: number, y?: number): void {
    this.xFilter.reset(x);
    this.yFilter.reset(y);
  }
}
