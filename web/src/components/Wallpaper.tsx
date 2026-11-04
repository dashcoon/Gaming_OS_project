import { glowColor, WALLPAPERS } from '@/data/theme';
import { useSettings } from '@/context/SettingsContext';

/** Dark gaming wallpaper with drifting ambient glows and a faint perspective grid. */
export default function Wallpaper() {
  const { settings } = useSettings();
  const wp = WALLPAPERS.find((w) => w.id === settings.wallpaper) ?? WALLPAPERS[0];
  const animate = settings.animatedWallpaper && settings.performanceMode !== 'power-saver';
  const [a, b, c] = wp.glows;

  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${wp.base} transition-colors duration-700`}>
      <div
        className={`absolute -left-[10%] -top-[15%] h-[65vh] w-[65vh] rounded-full blur-[110px] ${animate ? 'animate-float' : ''}`}
        style={{ background: glowColor(a, 0.42) }}
      />
      <div
        className={`absolute -right-[8%] top-[20%] h-[55vh] w-[55vh] rounded-full blur-[120px] ${animate ? 'animate-float-slow' : ''}`}
        style={{ background: glowColor(b, 0.32) }}
      />
      <div
        className={`absolute bottom-[-20%] left-[30%] h-[60vh] w-[70vh] rounded-full blur-[130px] ${animate ? 'animate-float' : ''}`}
        style={{ background: glowColor(c, 0.28), animationDelay: '-9s' }}
      />

      {/* Perspective grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[45vh] opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--accent) / 0.35) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--accent) / 0.35) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          transform: 'perspective(500px) rotateX(62deg)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, black 10%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 90%)',
        }}
      />
      {/* Logo watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="select-none bg-gradient-to-br from-white/10 to-white/0 bg-clip-text text-[12vw] font-extrabold tracking-tighter text-transparent">
          GamingOS
        </span>
      </div>
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)]" />
    </div>
  );
}
