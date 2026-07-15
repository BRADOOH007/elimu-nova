import React from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'white' | 'black'
}

const SIZE_HEIGHT: Record<string, number> = {
  sm:    28,
  md:    40,
  lg:    52,
  xl:    72,
  '2xl': 96,
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'white',  // default: white bg (dark mark)
}) => {
  /**
   * logo-black-removebg-preview.png = logo made FOR black/dark backgrounds (white lettering)
   * logo-white-removebg-preview.png = logo made FOR white/light backgrounds (dark lettering)
   *
   * variant="black" → dark background → use logo-black (white mark)
   * variant="white" → light background → use logo-white (dark mark)
   *
   * Default is "black" because dashboards have dark sidebars.
   */
  const logoSrc = variant === 'black'
    ? '/logo-black-removebg-preview.png'   // white mark → for dark/black backgrounds
    : '/logo-white-removebg-preview.png'   // dark mark  → for light/white backgrounds

  const h = SIZE_HEIGHT[size] ?? 40

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt="ElimuNova"
        height={h}
        style={{ height: h, width: 'auto', maxWidth: h * 2.5 }}
        className="object-contain flex-shrink-0"
      />
    </div>
  )
}
