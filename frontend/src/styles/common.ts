export const commonStyles = {
  // Layout
  pageContainer: "min-h-screen flex flex-col items-center justify-center p-4 text-gray-800",
  contentContainer: "w-full max-w-2xl mx-auto bg-white/90 p-6 md:p-8 rounded-xl shadow-2xl flex flex-col items-center text-center",
  
  // Gradients
  gradients: {
    home: "bg-gradient-to-br from-orange-100 via-red-100 to-yellow-100",
    part1: "bg-gradient-to-br from-orange-100 via-red-100 to-yellow-100",
    part2: "bg-gradient-to-br from-orange-100 via-red-100 to-yellow-100"
  },
  
  // Mina Character
  minaImage: "w-48 h-auto mx-auto mb-6",
  
  // Video Container
  videoContainer: "w-full max-w-xl mb-6 rounded-lg overflow-hidden shadow-lg",
  video: "w-full aspect-video bg-gray-800",
  
  // Progress Indicators
  progressDot: "w-3 h-3 rounded-full",
  progressDotActive: "bg-orange-600",
  progressDotInactive: "bg-gray-300",
  
  // Buttons
  primaryButton: "w-auto min-w-[200px] py-2.5 px-6 bg-orange-500 text-white text-base font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-400 mx-auto",
  secondaryButton: "w-auto min-w-[200px] py-2.5 px-6 bg-gray-300 text-gray-700 text-base font-semibold rounded-lg shadow-md hover:bg-gray-400 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 mx-auto",
  navigationButton: "w-auto min-w-[200px] py-2.5 px-6 bg-green-500 text-white text-base font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 mx-auto",
  closeButton: "text-gray-500 hover:text-orange-600 text-2xl transition-colors focus:outline-none",
  
  // Typography
  heading: "text-3xl font-bold text-orange-600 mb-4",
  subheading: "text-lg text-gray-700 mb-8",

  // Color Schemes
  colorSchemes: {
    default: {
      bg: 'bg-orange-50/80',
      text: 'text-orange-700',
      button: 'bg-orange-500',
      buttonHover: 'hover:bg-orange-600'
    }
  }
} as const; 