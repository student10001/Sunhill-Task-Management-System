import React from 'react';

interface SunhillLogoProps {
  className?: string;
}

export const SunhillLogo: React.FC<SunhillLogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <svg
      viewBox="0 0 500 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Clip path for the central circular emblem */}
        <clipPath id="circleClip">
          <circle cx="250" cy="200" r="130" />
        </clipPath>

        {/* Ribbon Gradient */}
        <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#005826" />
          <stop offset="50%" stopColor="#008a3c" />
          <stop offset="100%" stopColor="#005826" />
        </linearGradient>

        {/* Sun Rays Gradient */}
        <linearGradient id="sunRay" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffa000" />
          <stop offset="100%" stopColor="#ffc107" />
        </linearGradient>

        <linearGradient id="ribbonBorder" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffe082" />
          <stop offset="50%" stopColor="#fff59d" />
          <stop offset="100%" stopColor="#ffe082" />
        </linearGradient>
      </defs>

      {/* --- Central Circle Group with Sunburst, Sun, Hills, Birds, Book --- */}
      <g>
        {/* Background Sunburst inside circle */}
        <g clipPath="url(#circleClip)">
          <rect x="100" y="50" width="300" height="300" fill="#ffa000" />
          {/* Orange & Yellow Sunburst Rays */}
          <polygon points="250,200 100,50 140,50" fill="#ffc107" />
          <polygon points="250,200 180,50 220,50" fill="#ffc107" />
          <polygon points="250,200 260,50 300,50" fill="#ffc107" />
          <polygon points="250,200 340,50 380,50" fill="#ffc107" />
          <polygon points="250,200 395,110 400,150" fill="#ffc107" />
          <polygon points="250,200 400,190 400,230" fill="#ffc107" />
          <polygon points="250,200 100,110 100,150" fill="#ffc107" />
          <polygon points="250,200 100,190 100,230" fill="#ffc107" />

          {/* Yellow Rising Sun */}
          <circle cx="250" cy="225" r="42" fill="#ffeb3b" />

          {/* Rolling Green Hills */}
          <path
            d="M 100 240 Q 180 200 250 230 Q 320 200 400 240 L 400 350 L 100 350 Z"
            fill="#2e7d32"
          />
          <path
            d="M 100 260 Q 210 215 300 250 Q 360 230 400 270 L 400 350 L 100 350 Z"
            fill="#1b5e20"
            opacity="0.7"
          />

          {/* Flying Birds in Sky */}
          <g stroke="#004d40" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Top bird */}
            <path d="M 210 95 Q 225 80 240 95 Q 255 80 270 95" />
            {/* Middle bird right */}
            <path d="M 255 118 Q 275 105 295 118 Q 315 105 335 118" />
            {/* Lower bird center */}
            <path d="M 215 130 Q 240 115 265 130 Q 290 115 315 130" />
          </g>

          {/* Open Book Graphic */}
          <g stroke="#004d40" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Left page outline */}
            <path d="M 180 250 Q 215 230 250 250 L 250 295 Q 215 275 180 295 Z" fill="#4caf50" opacity="0.3" />
            <path d="M 180 250 Q 215 230 250 250 L 250 295 Q 215 275 180 295 Z" />
            {/* Right page outline */}
            <path d="M 250 250 Q 285 230 320 250 L 320 295 Q 285 275 250 295 Z" fill="#4caf50" opacity="0.3" />
            <path d="M 250 250 Q 285 230 320 250 L 320 295 Q 285 275 250 295 Z" />
            {/* Book Spine / Spreading pages lines */}
            <path d="M 250 250 L 250 295" strokeWidth="4" />
            <path d="M 190 240 Q 220 215 250 235 Q 280 215 310 240" strokeWidth="3" />
            <path d="M 200 230 Q 225 210 250 225 Q 275 210 300 230" strokeWidth="2.5" />
          </g>
        </g>

        {/* Outer Circular Green Border */}
        <circle cx="250" cy="200" r="130" stroke="#007a33" strokeWidth="12" fill="none" />
        <circle cx="250" cy="200" r="135" stroke="#004d20" strokeWidth="2" fill="none" />
      </g>

      {/* --- Left Laurel Wreath Branch --- */}
      <g fill="#007a33">
        {/* Main curved stem */}
        <path d="M 115 320 C 60 250 65 150 150 70" stroke="#007a33" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Leaf pairs left */}
        <path d="M 140 85 C 120 70 110 50 115 40 C 125 50 140 65 140 85 Z" />
        <path d="M 115 105 C 90 90 75 75 80 60 C 95 75 110 90 115 105 Z" />
        <path d="M 95 130 C 70 120 50 105 55 90 C 70 105 85 120 95 130 Z" />
        <path d="M 80 160 C 55 150 35 140 40 125 C 55 140 70 150 80 160 Z" />
        <path d="M 72 195 C 45 190 30 180 32 165 C 50 175 62 185 72 195 Z" />
        <path d="M 72 230 C 48 230 32 225 32 210 C 50 215 62 222 72 230 Z" />
        <path d="M 80 265 C 58 270 42 270 40 255 C 58 255 70 260 80 265 Z" />
        <path d="M 95 295 C 75 305 60 310 55 295 C 72 292 85 292 95 295 Z" />
        <path d="M 120 320 C 100 335 85 345 78 330 C 95 322 108 318 120 320 Z" />

        {/* Inner leaves branch left */}
        <path d="M 152 100 C 135 110 130 120 138 128 C 145 120 150 110 152 100 Z" />
        <path d="M 130 130 C 112 140 105 150 115 158 C 122 150 126 140 130 130 Z" />
        <path d="M 112 165 C 95 175 88 185 98 193 C 105 185 108 175 112 165 Z" />
        <path d="M 102 200 C 85 210 80 220 90 228 C 96 220 98 210 102 200 Z" />
        <path d="M 102 235 C 88 248 82 258 92 263 C 98 255 99 245 102 235 Z" />
      </g>

      {/* --- Right Laurel Wreath Branch --- */}
      <g fill="#007a33">
        {/* Main curved stem */}
        <path d="M 385 320 C 440 250 435 150 350 70" stroke="#007a33" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Leaf pairs right */}
        <path d="M 360 85 C 380 70 390 50 385 40 C 375 50 360 65 360 85 Z" />
        <path d="M 385 105 C 410 90 425 75 420 60 C 405 75 390 90 385 105 Z" />
        <path d="M 405 130 C 430 120 450 105 445 90 C 430 105 415 120 405 130 Z" />
        <path d="M 420 160 C 445 150 465 140 460 125 C 445 140 430 150 420 160 Z" />
        <path d="M 428 195 C 455 190 470 180 468 165 C 450 175 438 185 428 195 Z" />
        <path d="M 428 230 C 452 230 468 225 468 210 C 450 215 438 222 428 230 Z" />
        <path d="M 420 265 C 442 270 458 270 460 255 C 442 255 430 260 420 265 Z" />
        <path d="M 405 295 C 425 305 440 310 445 295 C 428 292 415 292 405 295 Z" />
        <path d="M 380 320 C 400 335 415 345 422 330 C 405 322 392 318 380 320 Z" />

        {/* Inner leaves branch right */}
        <path d="M 348 100 C 365 110 370 120 362 128 C 355 120 350 110 348 100 Z" />
        <path d="M 370 130 C 388 140 395 150 385 158 C 378 150 374 140 370 130 Z" />
        <path d="M 388 165 C 405 175 412 185 402 193 C 395 185 392 175 388 165 Z" />
        <path d="M 398 200 C 415 210 420 220 410 228 C 404 220 402 210 398 200 Z" />
        <path d="M 398 235 C 412 248 418 258 408 263 C 402 255 401 245 398 235 Z" />
      </g>

      {/* Cross Stems at Bottom */}
      <path d="M 195 410 L 290 320" stroke="#007a33" strokeWidth="8" strokeLinecap="round" />
      <path d="M 305 410 L 210 320" stroke="#007a33" strokeWidth="8" strokeLinecap="round" />

      {/* --- Ribbon Banner Across Bottom --- */}
      <g>
        {/* Ribbon Fold Background Tails */}
        <path d="M 75 365 L 140 335 L 140 385 L 75 405 Z" fill="#004d1a" />
        <path d="M 425 365 L 360 335 L 360 385 L 425 405 Z" fill="#004d1a" />

        {/* Ribbon Fishtail Left */}
        <path d="M 135 345 L 80 360 L 110 380 L 75 405 L 135 395 Z" fill="#007a33" stroke="#ffd700" strokeWidth="2" />
        {/* Ribbon Fishtail Right */}
        <path d="M 365 345 L 420 360 L 390 380 L 425 405 L 365 395 Z" fill="#007a33" stroke="#ffd700" strokeWidth="2" />

        {/* Main Curved Banner Body */}
        <path
          d="M 125 330 Q 250 355 375 330 C 390 370 385 380 375 395 Q 250 420 125 395 C 115 380 110 370 125 330 Z"
          fill="url(#ribbonGrad)"
          stroke="#ffd700"
          strokeWidth="4.5"
        />

        {/* Ribbon Inner Gold Border Line */}
        <path
          d="M 135 338 Q 250 363 365 338"
          stroke="#ffe082"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 135 387 Q 250 412 365 387"
          stroke="#ffe082"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Banner Text "SUNHILL" */}
        <text
          x="250"
          y="378"
          fill="#ffffff"
          stroke="#003311"
          strokeWidth="1"
          fontFamily="Times New Roman, Georgia, serif"
          fontWeight="900"
          fontSize="36"
          letterSpacing="8"
          textAnchor="middle"
        >
          SUNHILL
        </text>
      </g>

      {/* --- Text Below Ribbon: "education system" --- */}
      <text
        x="250"
        y="442"
        fill="#007a33"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="600"
        fontSize="26"
        letterSpacing="2"
        textAnchor="middle"
      >
        education system
      </text>
    </svg>
  );
};
