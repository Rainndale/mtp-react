import React from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import TripModal from './components/Modals/TripModal';
import ItineraryList from './components/Itinerary/ItineraryList';

function App() {
  const { activeTrip, loading, setIsModalOpen, sidebarOpen, toggleSidebar } = useApp();

  if (loading) {
      return (
          <div id="loader" className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col items-center justify-center transition-opacity duration-700">
              <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                  <i className="fa-solid fa-plane-departure absolute inset-0 flex items-center justify-center text-3xl text-blue-500"></i>
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic text-center leading-none">Voyager</h1>
          </div>
      );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Sidebar Overlay */}
      <div
          onClick={toggleSidebar}
          className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      ></div>
      <Sidebar />
      <Header />

      {/* Content */}
      <main id="app-root">
          <div id="content" className="pt-16 md:pt-20 px-0 md:px-8 w-full md:w-[97vw] mx-auto">
              {!activeTrip ? (
                   <div id="empty-state" className="flex flex-col items-center justify-center py-24 text-center">
                       <div className="flex items-center justify-center mb-8">
                           <i className="fa-solid fa-map-location-dot text-7xl text-muted/30 dark:text-muted/20 animate-float"></i>
                       </div>
                       <h3 className="text-2xl font-black text-current mb-2 italic uppercase tracking-tighter">No active itinerary</h3>
                       <p className="text-muted text-sm mb-8 max-w-xs mx-auto">Your next adventure is waiting to be mapped out. Start your expedition today.</p>
                       <button onClick={() => setIsModalOpen('TRIP_NEW')} className="px-10 py-4 bg-accent text-white rounded-xl font-bold transition-all shadow-xl hover:scale-105 active:scale-95">Create Trip</button>
                   </div>
              ) : (
                  <>
                    <div id="trip-hero" className="relative w-[95%] md:w-full mx-auto h-48 md:h-64 rounded-lg overflow-hidden mb-8 animate-fade-in shadow-xl">
                        <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200" alt="Travel" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{activeTrip.name}</h1>
                            <p className="text-blue-200 font-medium text-sm md:text-base mt-1">
                                <i className="fa-solid fa-calendar-days mr-2"></i>
                                {new Date(activeTrip.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(activeTrip.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    {/* Itinerary List */}
                    <ItineraryList />
                  </>
              )}
          </div>
      </main>

      <TripModal />
    </div>
  );
}

export default App;
