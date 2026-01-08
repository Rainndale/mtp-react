import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

const PlanModal = ({ planId, defaultDate, onClose }) => {
    const { activeTrip, handleSaveTrip, handleDeleteTrip, setIsModalOpen } = useApp();
    const [plan, setPlan] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: 'Activity',
        status: 'Tentative',
        date: defaultDate || '',
        time: '',
        location: '',
        mapLink: '',
        cost: '',
        bookingRef: '',
        details: ''
    });

    // Suggestions state
    const [suggestions, setSuggestions] = useState([]);
    const [activeField, setActiveField] = useState(null);

    useEffect(() => {
        if (planId && activeTrip) {
            const existing = activeTrip.plans.find(p => p.id === planId);
            if (existing) {
                setPlan(existing);
                setFormData({
                    title: existing.title || '',
                    category: existing.category || 'Activity',
                    status: existing.status || 'Tentative',
                    date: existing.date || '',
                    time: existing.time || '',
                    location: existing.location || '',
                    mapLink: existing.mapLink || '',
                    cost: existing.cost || '',
                    bookingRef: existing.bookingRef || '',
                    details: existing.details || ''
                });
            }
        } else if (defaultDate) {
             setFormData(prev => ({ ...prev, date: defaultDate }));
        }
    }, [planId, activeTrip, defaultDate]);

    const handleInput = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Mock suggestion logic based on previous inputs in memory (if available)
        // In a real app, you might query the DB for unique values.
        // For now, I'll just clear suggestions.
        if (field === 'title' || field === 'location') {
             // Logic to filter existing plans from activeTrip could go here
             // keeping it simple for now as per "native" feel
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.date) return; // Add notification

        const newPlan = {
            id: plan ? plan.id : `p_${Date.now()}`,
            ...formData,
            order: plan ? plan.order : (activeTrip.plans?.length || 0)
        };

        const updatedPlans = activeTrip.plans ? [...activeTrip.plans] : [];
        const idx = updatedPlans.findIndex(p => p.id === newPlan.id);

        if (idx > -1) updatedPlans[idx] = newPlan;
        else updatedPlans.push(newPlan);

        const updatedTrip = { ...activeTrip, plans: updatedPlans };
        await handleSaveTrip(updatedTrip);
        onClose();
    };

    const handleDelete = async () => {
        if (!plan) return;
        const updatedPlans = activeTrip.plans.filter(p => p.id !== plan.id);
        const updatedTrip = { ...activeTrip, plans: updatedPlans };
        await handleSaveTrip(updatedTrip);
        onClose();
    };

    return (
        <div id="modal-container" className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div id="modal-backdrop" onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"></div>
            <div id="modal-content" className="relative w-full max-w-md bg-[var(--modal-bg)] p-6 rounded-lg shadow-2xl max-h-[85vh] flex flex-col animate-slide-up border border-[var(--card-border)]">
                <div className="flex-1 overflow-y-auto min-h-0 -ml-1 pl-1 -mr-2 pr-2 pb-2">
                    <h2 className="text-2xl font-black text-current italic uppercase tracking-tighter mb-6 text-center leading-none">
                        {plan ? 'Edit Mode' : 'New Plan'}
                    </h2>
                    <div className="space-y-5">
                        <div className="floating-group">
                            <input
                                type="text"
                                placeholder=" "
                                autoComplete="off"
                                className="floating-input"
                                value={formData.title}
                                onChange={(e) => handleInput('title', e.target.value)}
                            />
                            <label className="floating-label">Activity Title</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="floating-group">
                                <select
                                    className="floating-select"
                                    value={formData.category}
                                    onChange={(e) => handleInput('category', e.target.value)}
                                >
                                    {['Activity', 'Flight', 'Hotel', 'Food', 'Transport', 'Sightseeing'].map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <label className="floating-label">Category</label>
                            </div>
                            <div className="floating-group">
                                <select
                                    className="floating-select"
                                    value={formData.status}
                                    onChange={(e) => handleInput('status', e.target.value)}
                                >
                                    <option value="Tentative">Tentative</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                <label className="floating-label">Booking Status</label>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="floating-group">
                                <input
                                    type="date"
                                    className="floating-input"
                                    value={formData.date}
                                    onChange={(e) => handleInput('date', e.target.value)}
                                />
                                <label className="floating-label">Date</label>
                            </div>
                            <div className="floating-group">
                                <input
                                    type="time"
                                    className="floating-input"
                                    value={formData.time}
                                    onChange={(e) => handleInput('time', e.target.value)}
                                />
                                <label className="floating-label">Time</label>
                            </div>
                        </div>
                        <div className="floating-group">
                            <input
                                type="text"
                                placeholder=" "
                                autoComplete="off"
                                className="floating-input"
                                value={formData.location}
                                onChange={(e) => handleInput('location', e.target.value)}
                            />
                            <label className="floating-label">Location Address</label>
                        </div>
                        <div className="floating-group">
                            <input
                                type="text"
                                placeholder=" "
                                className="floating-input"
                                value={formData.mapLink}
                                onChange={(e) => handleInput('mapLink', e.target.value)}
                            />
                            <label className="floating-label">Map Link (Google Maps URL)</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="floating-group">
                                <input
                                    type="text"
                                    placeholder=" "
                                    className="floating-input"
                                    value={formData.cost}
                                    onChange={(e) => handleInput('cost', e.target.value)}
                                />
                                <label className="floating-label">Cost</label>
                            </div>
                            <div className="floating-group">
                                <input
                                    type="text"
                                    placeholder=" "
                                    className="floating-input"
                                    value={formData.bookingRef}
                                    onChange={(e) => handleInput('bookingRef', e.target.value)}
                                />
                                <label className="floating-label">Booking Ref</label>
                            </div>
                        </div>
                        <div className="floating-group">
                            <textarea
                                placeholder=" "
                                className="floating-textarea"
                                value={formData.details}
                                onChange={(e) => handleInput('details', e.target.value)}
                            ></textarea>
                            <label className="floating-label">Notes</label>
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0 pt-4 mt-auto">
                    <div className="flex space-x-3">
                        {plan && (
                            <button onClick={handleDelete} className="px-4 text-rose-500 font-bold text-sm text-center">Delete</button>
                        )}
                        <div className="flex-grow"></div>
                        <button onClick={onClose} className="px-6 py-4 text-muted font-bold hover:text-current transition-all text-sm text-center">Cancel</button>
                        <button onClick={handleSave} className="px-8 py-3 bg-accent text-white font-bold rounded-lg transition-all shadow-lg text-sm text-center">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanModal;
