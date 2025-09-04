export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"></div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <main className="text-center space-y-8 px-8">
          <div className="relative pb-4">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse pb-4">
              Trilogy Care
            </h1>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent blur-sm opacity-50 text-6xl md:text-8xl font-bold">
              Trilogy Care
            </div>
          </div>
          
          <div className="relative">
            <h2 className="text-xl md:text-2xl text-white/90 font-medium backdrop-blur-sm bg-white/10 rounded-full px-8 py-4 border border-white/20 shadow-2xl">
              Please view the README.md file for the task instructions
            </h2>
          </div>
        </main>
      </div>
    </div>
  );
}
