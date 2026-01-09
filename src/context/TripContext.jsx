import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadAllTrips, saveTrip, deleteTrip as deleteTripDB } from '../services/db';

const TripContext = createContext();

export const useTrip = () => useContext(TripContext);

export const TripProvider = ({ children }) => {
    const [trips, setTrips] = useState([]);
    const [activeTrip, setActiveTrip] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [collapsedDays, setCollapsedDays] = useState({});

    // Initialize Theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('voyager_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        }
    }, []);

    // Toggle Theme
    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('voyager_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('voyager_theme', 'light');
        }
    };

    // Load Trips
    const refreshTrips = async () => {
        try {
            const loadedTrips = await loadAllTrips();
            setTrips(loadedTrips);

            // Sync active trip if it exists
            if (activeTrip) {
                const dbVersion = loadedTrips.find(t => t.id === activeTrip.id);
                if (dbVersion) {
                    setActiveTrip(dbVersion);
                } else {
                    setActiveTrip(null);
                }
            } else if (loadedTrips.length > 0 && !activeTrip) {
                // Auto-select first trip if none active
                 setActiveTrip(loadedTrips[0]);
            }
        } catch (error) {
            console.error("Failed to load trips:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshTrips();
        // Load collapsed state
        const savedCollapsed = localStorage.getItem('voyager_collapsed_days');
        if (savedCollapsed) {
            setCollapsedDays(JSON.parse(savedCollapsed));
        }
    }, []);

    const setActiveTripId = (id) => {
        const trip = trips.find(t => t.id === id);
        setActiveTrip(trip || null);
    };

    const addOrUpdateTrip = async (tripData) => {
        // Optimistic update
        setActiveTrip(tripData);
        setTrips(prev => {
            const idx = prev.findIndex(t => t.id === tripData.id);
            if (idx >= 0) {
                const newTrips = [...prev];
                newTrips[idx] = tripData;
                return newTrips;
            }
            return [...prev, tripData];
        });

        await saveTrip(tripData);
        // refreshTrips() not strictly needed if we trust the optimistic update,
        // but good for eventual consistency if DB adds fields.
        // We'll leave it out to prevent 'snap back' if DB is slow, or verify it doesn't revert state.
        // Actually, let's just save.
    };

    const removeTrip = async (id) => {
        await deleteTripDB(id);
        if (activeTrip?.id === id) setActiveTrip(null);
        await refreshTrips();
    };

    const toggleDayCollapse = (tripId, date) => {
        const key = `${tripId}_${date}`;
        const newState = { ...collapsedDays, [key]: !collapsedDays[key] };
        setCollapsedDays(newState);
        localStorage.setItem('voyager_collapsed_days', JSON.stringify(newState));
    };

    const isDayCollapsed = (tripId, date) => {
        return !!collapsedDays[`${tripId}_${date}`];
    };

    return (
        <TripContext.Provider value={{
            trips,
            activeTrip,
            isLoading,
            isDarkMode,
            toggleTheme,
            setActiveTripId,
            addOrUpdateTrip,
            removeTrip,
            toggleDayCollapse,
            isDayCollapsed,
            refreshTrips
        }}>
            {children}
        </TripContext.Provider>
    );
};
