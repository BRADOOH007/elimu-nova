import React from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'white' | 'black'
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  variant = 'black'
}) => {
  const sizeStyles = {
    sm:  { height: 24 },
    md:  { height: 36 },
    lg:  { height: 48 },
    xl:  { height: 64 },
    '2xl': { height: 80 },
  }

  const logoSrc = variant === 'white' ? '/logo-black-removebg-preview.png' : '/logo-white-removebg-preview.png'

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoSrc} 
        alt="Elimu Nova" 
        style={sizeStyles[size]}
        className="w-auto object-contain"
      />
    </div>
  )
}
