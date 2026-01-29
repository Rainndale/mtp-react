import React from 'react';

const CinematicLoader = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div id="loader" className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col items-center justify-center transition-opacity duration-700">
            <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl text-indigo-600">
                     <i className="fa-solid fa-plane-departure"></i>
                </div>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic text-center leading-none">Voyager</h1>
        </div>
    );
};

export default CinematicLoader;
