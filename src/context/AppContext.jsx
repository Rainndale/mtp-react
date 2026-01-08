import React, { createContext, useContext, useState, useEffect } from 'react';
import { initDB, loadAll, saveToDB, deleteFromDB, THEME_KEY, COLLAPSE_KEY } from '../services/storage';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [trips, setTrips] = useState([]);
    const [activeTrip, setActiveTrip] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem(THEME_KEY) || 'system');
    const [collapsedDays, setCollapsedDays] = useState(JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '{}'));
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            await initDB();
            const loadedTrips = await loadAll();
            setTrips(loadedTrips);
            if (loadedTrips.length > 0) setActiveTrip(loadedTrips[0]);
            setLoading(false);

            // Theme Logic
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (theme === 'dark' || (theme === 'system' && prefersDark)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };
        init();
    }, []);

    // Theme Toggle
    const toggleTheme = () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        if (newTheme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        setTheme(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    };

    // Sidebar Toggle
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    // Trip Management
    const refreshTrips = async () => {
        const loaded = await loadAll();
        setTrips(loaded);
        if (activeTrip) {
            const updated = loaded.find(t => t.id === activeTrip.id);
            if (updated) setActiveTrip(updated);
        } else if (loaded.length > 0) {
            setActiveTrip(loaded[0]);
        }
    };

    const handleSaveTrip = async (tripData) => {
        await saveToDB(tripData);
        await refreshTrips();
        // If it's a new trip (not previously active), set it as active
        if (!activeTrip || activeTrip.id !== tripData.id) {
            setActiveTrip(tripData);
        }
    };

    const handleDeleteTrip = async (id) => {
        await deleteFromDB(id);
        const loaded = await loadAll();
        setTrips(loaded);
        setActiveTrip(loaded.length > 0 ? loaded[0] : null);
    };

    // Collapse Logic
    const toggleDayCollapse = (tripId, date) => {
        const key = `${tripId}_${date}`;
        const newState = { ...collapsedDays, [key]: !collapsedDays[key] };
        setCollapsedDays(newState);
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(newState));
    };

    return (
        <AppContext.Provider value={{
            trips, activeTrip, setActiveTrip,
            theme, toggleTheme,
            sidebarOpen, toggleSidebar, setSidebarOpen,
            collapsedDays, toggleDayCollapse,
            loading, refreshTrips, handleSaveTrip, handleDeleteTrip,
            isModalOpen, setIsModalOpen
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
