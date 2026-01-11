import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ItineraryList from './components/features/ItineraryList';
import TripModal from './components/features/TripModal';
import PlanModal from './components/features/PlanModal';
import PlanViewModal from './components/features/PlanViewModal';
import CinematicLoader from './components/ui/CinematicLoader';
import { TripProvider, useTrip } from './context/TripContext';
import { formatDate } from './utils/date';

const Content = () => {
    const { activeTrip, isLoading } = useTrip();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isTripModalOpen, setIsTripModalOpen] = useState(false);
    const [tripToEdit, setTripToEdit] = useState(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isPlanViewModalOpen, setIsPlanViewModalOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState(null);
    const [planToView, setPlanToView] = useState(null);
    const [defaultPlanDate, setDefaultPlanDate] = useState(null);

    if (isLoading) return <CinematicLoader isVisible={true} />;

    const handleOpenTripModal = (trip = null) => {
        setTripToEdit(trip);
        setIsTripModalOpen(true);
    };

    const handleOpenPlanModal = (date = null) => {
        setPlanToEdit(null);
        setDefaultPlanDate(date);
        setIsPlanModalOpen(true);
    };

    const handleViewPlan = (plan) => {
        setPlanToView(plan);
        setIsPlanViewModalOpen(true);
    };

    const handleEditPlanFromView = (plan) => {
        setIsPlanViewModalOpen(false);
        setPlanToEdit(plan);
        setDefaultPlanDate(null);
        setIsPlanModalOpen(true);
    };

    return (
        <div className="min-h-screen pb-24 bg-[var(--bg-color)] transition-colors duration-400">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onOpenTripModal={handleOpenTripModal}
            />

            <Header
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onEditTrip={handleOpenTripModal}
            />

            <div className="pt-16 md:pt-20 px-0 md:px-8 w-full md:w-[97vw] mx-auto">
                {activeTrip && (
                    <div className="relative w-[95%] md:w-full mx-auto h-48 md:h-64 rounded-lg overflow-hidden mb-8 shadow-xl animate-fade-in">
                        <img src="images/cover.jpg" alt="Travel" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{activeTrip.name}</h1>
                            <p className="text-blue-200 font-medium text-sm md:text-base mt-1">
                                <i className="fa-solid fa-calendar-days mr-2"></i>
                                {formatDate(activeTrip.startDate)} — {formatDate(activeTrip.endDate)}
                            </p>
                        </div>
                    </div>
                )}

                <ItineraryList
                    onOpenPlanModal={handleOpenPlanModal}
                    onEditPlan={handleViewPlan}
                />
            </div>

            <TripModal
                isOpen={isTripModalOpen}
                onClose={() => setIsTripModalOpen(false)}
                tripToEdit={tripToEdit}
            />

            <PlanModal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                planToEdit={planToEdit}
                defaultDate={defaultPlanDate}
            />

            <PlanViewModal
                isOpen={isPlanViewModalOpen}
                onClose={() => setIsPlanViewModalOpen(false)}
                plan={planToView}
                onEdit={handleEditPlanFromView}
            />
        </div>
    );
};

function App() {
  React.useEffect(() => {
    const handleContextMenu = (e) => {
      // Allow context menu for inputs and textareas so users can Paste
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <TripProvider>
       <Content />
    </TripProvider>
  );
}

export default App;
