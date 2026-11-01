/**
 * NimbusPlay — Original Procedural SVG Channel Artwork
 * Centered vector graphics, smooth gradients, crisp typography.
 */

export const CHANNEL_ART = {
  sliceParty: `
    <div class="relative w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-tr from-[#ffe6b3] via-[#ffeedd] to-[#d6f4ff] overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85)_0%,transparent_75%)] pointer-events-none"></div>
      
      <!-- Centered Graphics Cluster -->
      <div class="relative flex items-center justify-center gap-2 transform group-hover:scale-110 transition-transform duration-300 my-auto">
        <!-- Watermelon Slice SVG -->
        <div class="relative w-14 h-14 flex items-center justify-center drop-shadow-md">
          <svg class="w-full h-full" viewBox="0 0 100 100">
            <path d="M10 50 A40 40 0 0 0 90 50 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
            <path d="M14 50 A36 36 0 0 0 86 50 Z" fill="#fef08a"/>
            <path d="M18 50 A32 32 0 0 0 82 50 Z" fill="#ef4444"/>
            <circle cx="35" cy="58" r="3.5" fill="#1f2937"/>
            <circle cx="50" cy="64" r="3.5" fill="#1f2937"/>
            <circle cx="65" cy="58" r="3.5" fill="#1f2937"/>
          </svg>
        </div>
        <!-- Spinning Orange Slice SVG -->
        <div class="relative w-12 h-12 flex items-center justify-center -ml-3 drop-shadow-md">
          <svg class="w-full h-full animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="#f97316"/>
            <circle cx="50" cy="50" r="40" fill="#ffedd5"/>
            <circle cx="50" cy="50" r="36" fill="#fb923c"/>
            <path d="M50 14 L50 86 M14 50 L86 50 M24 24 L76 76 M24 76 L76 24" stroke="#ffedd5" stroke-width="4" stroke-linecap="round"/>
          </svg>
        </div>
        <!-- Cyan Splash Splatter -->
        <div class="absolute -right-3 -top-2 opacity-95">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#3cb4e7">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 17px; font-weight: 900; color: #ff5722; text-shadow: 0 1px 2px rgba(255,255,255,0.9); letter-spacing: -0.01em;">Slice Party!</span>
      </div>
    </div>
  `,

  starDefender: `
    <div class="relative w-full h-full flex flex-col items-center justify-between p-3 bg-gradient-to-b from-[#1b2b3a] via-[#101b24] to-[#080d12] text-white overflow-hidden">
      <!-- Star dots -->
      <div class="absolute inset-0 opacity-40 pointer-events-none">
        <div style="position: absolute; top: 15%; left: 20%; width: 2.5px; height: 2.5px; background: white; border-radius: 50%;"></div>
        <div style="position: absolute; top: 35%; right: 25%; width: 3.5px; height: 3.5px; background: #76d1ff; border-radius: 50%;"></div>
        <div style="position: absolute; bottom: 25%; left: 30%; width: 2.5px; height: 2.5px; background: white; border-radius: 50%;"></div>
      </div>
      
      <div class="w-full flex items-center justify-center pt-0.5">
        <span style="font-size: 10px; color: #8bceff; text-transform: uppercase; font-weight: 800; letter-spacing: 0.12em;">Virtual Arc</span>
      </div>

      <!-- Centered Spaceship Cluster -->
      <div class="flex flex-col items-center justify-center my-auto">
        <div class="relative flex flex-col items-center drop-shadow-[0_4px_14px_rgba(95,191,254,0.7)]">
          <!-- Spaceship Vector -->
          <svg class="w-13 h-13 transform -translate-y-0.5 group-hover:-translate-y-1.5 transition-transform" viewBox="0 0 80 80" width="50" height="50">
            <path d="M40 8 L54 50 L40 44 L26 50 Z" fill="#e8f2ff"/>
            <path d="M40 18 L46 44 L40 40 L34 44 Z" fill="#5fbffe"/>
            <path d="M26 50 L18 64 L28 58 Z" fill="#006492"/>
            <path d="M54 50 L62 64 L52 58 Z" fill="#006492"/>
            <circle cx="40" cy="30" r="4.5" fill="#3cb4e7"/>
          </svg>
          <div style="width: 12px; height: 14px; background: #3cb4e7; border-radius: 9999px; filter: blur(3px); margin-top: -4px;"></div>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 16px; font-weight: 800; color: #f7f9ff; letter-spacing: 0.04em;">Star Defender</span>
      </div>
    </div>
  `,

  bowlBlitz: `
    <div class="relative w-full h-full flex flex-col items-center justify-between p-3 bg-gradient-to-b from-[#e3efff] via-[#cce0f5] to-[#b3cde3] overflow-hidden">
      <div class="w-full flex items-center justify-center pt-0.5">
        <span style="font-size: 10px; color: #51606a; text-transform: uppercase; font-weight: 800; letter-spacing: 0.12em;">Sports Hub</span>
      </div>

      <!-- Centered Pins & Ball Cluster -->
      <div class="flex flex-col items-center justify-center my-auto">
        <div class="relative flex items-center justify-center gap-1.5 transform group-hover:scale-105 transition-transform">
          <!-- Bowling Pin 1 -->
          <div style="width: 14px; height: 42px; background: #ffffff; border-radius: 9999px; box-shadow: 0 2px 5px rgba(0,0,0,0.18); display: flex; flex-direction: column; align-items: center; border-top: 2.5px solid #ef4444;">
            <div style="width: 100%; height: 3.5px; background: #ef4444; margin: 3.5px 0;"></div>
          </div>
          <!-- Ball -->
          <div class="relative transform group-hover:rotate-45 transition-transform duration-500" style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #ffffff 0%, #cfdbeb 50%, #51606a 100%); box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
            <div style="width: 4.5px; height: 4.5px; border-radius: 50%; background: #334155; position: absolute; top: 10px; left: 11px;"></div>
            <div style="width: 4.5px; height: 4.5px; border-radius: 50%; background: #334155; position: absolute; top: 10px; right: 11px;"></div>
            <div style="width: 4.5px; height: 4.5px; border-radius: 50%; background: #334155; position: absolute; bottom: 11px; left: 17px;"></div>
          </div>
          <!-- Bowling Pin 2 -->
          <div style="width: 14px; height: 42px; background: #ffffff; border-radius: 9999px; box-shadow: 0 2px 5px rgba(0,0,0,0.18); display: flex; flex-direction: column; align-items: center; transform: rotate(14deg); margin-top: -6px; border-top: 2.5px solid #ef4444;">
            <div style="width: 100%; height: 3.5px; background: #ef4444; margin: 3.5px 0;"></div>
          </div>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 16px; font-weight: 800; color: #111d28; letter-spacing: -0.01em;">Bowl Blitz</span>
      </div>
    </div>
  `,

  settings: `
    <div class="relative w-full h-full flex flex-col items-center justify-between p-3 bg-gradient-to-br from-[#e3efff] via-[#dde9f9] to-[#d7e4f4] overflow-hidden">
      <div class="w-full flex items-center justify-center pt-0.5">
        <span style="font-size: 10px; color: #51606a; text-transform: uppercase; font-weight: 800; letter-spacing: 0.12em;">System</span>
      </div>

      <!-- Centered Ceramic Cog Pod -->
      <div class="flex flex-col items-center justify-center my-auto">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #ffffff; box-shadow: 0 4px 12px rgba(120,140,160,0.25); display: flex; align-items: center; justify-content: center; border: 1px solid #cfd8e0;" class="group-hover:rotate-90 transition-transform duration-700">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#006688">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 16px; font-weight: 800; color: #111d28; letter-spacing: -0.01em;">Settings</span>
      </div>
    </div>
  `,

  controllerSync: `
    <div class="relative w-full h-full flex flex-col items-center justify-between p-3 bg-gradient-to-br from-[#edf4ff] via-[#e3efff] to-[#dde9f9] overflow-hidden">
      <div class="w-full flex items-center justify-center pt-0.5">
        <span style="font-size: 10px; color: #006688; text-transform: uppercase; font-weight: 800; letter-spacing: 0.12em;">Wireless</span>
      </div>

      <!-- Centered Wireless Wand Pod -->
      <div class="flex flex-col items-center justify-center my-auto">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #ffffff; box-shadow: 0 4px 12px rgba(120,140,160,0.25); display: flex; align-items: center; justify-content: center; border: 1px solid #cfd8e0;" class="group-hover:scale-110 transition-transform">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#3cb4e7">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 3.5c3.55 0 6.77 1.45 9.12 3.8L12 18.42 2.88 11.3A12.92 12.92 0 0 1 12 7.5z"/>
          </svg>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 16px; font-weight: 800; color: #111d28; letter-spacing: -0.01em;">Controller Pairing</span>
      </div>
    </div>
  `,

  calibration: `
    <div class="relative w-full h-full flex flex-col items-center justify-between p-3 bg-gradient-to-br from-[#f7f9ff] via-[#edf4ff] to-[#dde9f9] overflow-hidden">
      <div class="w-full flex items-center justify-center pt-0.5">
        <span style="font-size: 10px; color: #51606a; text-transform: uppercase; font-weight: 800; letter-spacing: 0.12em;">Sensors</span>
      </div>

      <!-- Centered Reticle Pod -->
      <div class="flex flex-col items-center justify-center my-auto">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #ffffff; box-shadow: 0 4px 12px rgba(120,140,160,0.25); display: flex; align-items: center; justify-content: center; border: 1px solid #cfd8e0;" class="group-hover:rotate-45 transition-transform duration-500">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#006688">
            <circle cx="12" cy="12" r="9" stroke="#3cb4e7" stroke-width="2" fill="none"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#006688" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="3" fill="#3cb4e7"/>
          </svg>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 16px; font-weight: 800; color: #111d28; letter-spacing: -0.01em;">Pointer Tuning</span>
      </div>
    </div>
  `,

  emptySlot: `
    <svg class="absolute bottom-0 left-0 w-full h-1/2 opacity-25 text-surface-container-highest" preserveAspectRatio="none" viewBox="0 0 200 60">
      <path d="M0 30 Q50 10 100 30 T200 30 V60 H0 Z" fill="#cfdbeb"></path>
    </svg>
  `
};
