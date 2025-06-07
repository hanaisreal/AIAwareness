export const animations = {
  fadeIn: `
    .animate-fade-in {
      animation: fadeIn 0.7s ease-out;
    }
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(15px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `,
  
  pulse: `
    .animate-pulse-custom {
      animation: pulseCustom 1.5s infinite ease-in-out;
    }
    @keyframes pulseCustom {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `,
  
  slideIn: `
    .animate-slide-in {
      animation: slideIn 0.5s ease-out;
    }
    @keyframes slideIn {
      0% { transform: translateX(-20px); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
  `,
  
  scaleIn: `
    .animate-scale-in {
      animation: scaleIn 0.3s ease-out;
    }
    @keyframes scaleIn {
      0% { transform: scale(0.95); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `
} as const; 