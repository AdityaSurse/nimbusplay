/**
 * NimbusPlay — First-Run Onboarding Experience
 * Explains wand holding, pairing, gyroscope calibration, and controls.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { audioManager } from '../audio/audio-manager.js';

export interface OnboardingSlide {
  badge: string;
  title: string;
  description: string;
  icon: string;
  tips: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    badge: 'Step 1 of 4: Posture',
    title: 'Hold Phone Vertically',
    description: 'Hold your smartphone upright in portrait mode, pointing the top of the phone toward the TV/monitor like a wand.',
    icon: 'smartphone',
    tips: [
      'Grip the phone securely with your dominant hand',
      'Keep your index finger over the on-screen B trigger button',
      'Natural wrist pivots will drive on-screen cursor aim'
    ]
  },
  {
    badge: 'Step 2 of 4: Pairing',
    title: 'Instant Wireless Pairing',
    description: 'Scan the pairing QR code displayed on the TV using your phone\'s camera or Chrome browser. Zero downloads required.',
    icon: 'qr_code_scanner',
    tips: [
      'Both laptop and phone must be on the same local Wi-Fi or mobile hotspot',
      'Tap "Enable Motion Sensors" when prompted on the phone',
      'The controller runs securely over local HTTPS with 60Hz telemetry'
    ]
  },
  {
    badge: 'Step 3 of 4: Calibration',
    title: 'Zero Gyroscope Drift',
    description: 'Mobile gyroscopes can experience minute sensor drift. Calibrate anytime to establish an exact resting baseline.',
    icon: 'tune',
    tips: [
      'Rest the phone still for 1 second on a flat table or steady hand',
      'Press Spacebar or tap Recenter anytime to snap the pointer to center',
      'Adjust sensitivity and One Euro jitter smoothing in Settings'
    ]
  },
  {
    badge: 'Step 4 of 4: Gameplay',
    title: 'Ready for the Arcade!',
    description: 'Launch games directly from the Channel Matrix and immerse yourself in classic motion gaming.',
    icon: 'sports_esports',
    tips: [
      'Fruit Ninja: Hold B and swing the wand to slice flying fruits',
      'Alien Attack: Hold phone sideways like a flight yoke to steer & shoot',
      'Shooting Range: Aim crosshairs with pointer, tap A to hit targets',
      'Sketch: Point at easel and hold A to draw smooth calligraphy'
    ]
  }
];

export class OnboardingManager {
  private overlayEl: HTMLElement | null = null;
  private currentStep = 0;
  private onCompleteCallback?: () => void;

  constructor(onComplete?: () => void) {
    this.onCompleteCallback = onComplete;
    this.overlayEl = document.getElementById('onboarding-overlay');
    this.bindEvents();
  }

  public shouldAutoLaunch(): boolean {
    return localStorage.getItem('nimbusplay_onboarding_completed') !== 'true';
  }

  public open(): void {
    if (!this.overlayEl) return;
    this.currentStep = 0;
    this.renderSlide();
    this.overlayEl.classList.add('open');
    audioManager.playSelect();
  }

  public close(): void {
    if (!this.overlayEl) return;
    this.overlayEl.classList.remove('open');
    localStorage.setItem('nimbusplay_onboarding_completed', 'true');
    audioManager.playBack();
    this.onCompleteCallback?.();
  }

  private next(): void {
    if (this.currentStep < SLIDES.length - 1) {
      this.currentStep++;
      this.renderSlide();
      audioManager.playPageTurn();
    } else {
      this.close();
    }
  }

  private prev(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderSlide();
      audioManager.playPageTurn();
    }
  }

  private renderSlide(): void {
    const slide = SLIDES[this.currentStep];
    const badgeEl = document.getElementById('onboarding-badge');
    const titleEl = document.getElementById('onboarding-title');
    const descEl = document.getElementById('onboarding-desc');
    const iconEl = document.getElementById('onboarding-icon');
    const tipsListEl = document.getElementById('onboarding-tips');
    const btnPrev = document.getElementById('btn-onboarding-prev') as HTMLButtonElement | null;
    const btnNext = document.getElementById('btn-onboarding-next') as HTMLButtonElement | null;
    const pipsEl = document.getElementById('onboarding-pips');

    if (badgeEl) badgeEl.textContent = slide.badge;
    if (titleEl) titleEl.textContent = slide.title;
    if (descEl) descEl.textContent = slide.description;
    if (iconEl) iconEl.textContent = slide.icon;

    if (tipsListEl) {
      tipsListEl.innerHTML = slide.tips.map((t) => `
        <li style="display:flex; align-items:flex-start; gap:10px; font-size:14px; color:#51606a;">
          <span class="material-symbols-outlined" style="font-size:18px; color:#006688; margin-top:2px;">check_circle</span>
          <span>${t}</span>
        </li>
      `).join('');
    }

    if (btnPrev) {
      btnPrev.style.visibility = this.currentStep === 0 ? 'hidden' : 'visible';
    }

    if (btnNext) {
      btnNext.innerHTML = this.currentStep === SLIDES.length - 1
        ? `<span>Get Started</span><span class="material-symbols-outlined" style="font-size:20px;">play_arrow</span>`
        : `<span>Next</span><span class="material-symbols-outlined" style="font-size:20px;">arrow_forward</span>`;
    }

    if (pipsEl) {
      pipsEl.innerHTML = SLIDES.map((_, i) => `
        <span style="width:${i === this.currentStep ? '24px' : '8px'}; height:8px; border-radius:4px; background:${i === this.currentStep ? '#006688' : '#cfd8e0'}; transition:all 0.2s ease;"></span>
      `).join('');
    }
  }

  private bindEvents(): void {
    const btnNext = document.getElementById('btn-onboarding-next');
    const btnPrev = document.getElementById('btn-onboarding-prev');
    const btnSkip = document.getElementById('btn-onboarding-skip');

    btnNext?.addEventListener('click', () => this.next());
    btnPrev?.addEventListener('click', () => this.prev());
    btnSkip?.addEventListener('click', () => this.close());
  }
}

