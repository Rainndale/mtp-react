import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import FloatingInput from '../ui/FloatingInput';
import FloatingSelect from '../ui/FloatingSelect';
import FloatingTextarea from '../ui/FloatingTextarea';
import { useTrip } from '../../context/TripContext';

const PlanModal = ({ isOpen, onClose, planToEdit, defaultDate }) => {
    const { activeTrip, addOrUpdateTrip } = useTrip();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Activity');
    const [status, setStatus] = useState('Tentative');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [mapLink, setMapLink] = useState('');
    const [cost, setCost] = useState('');
    const [bookingRef, setBookingRef] = useState('');
    const [details, setDetails] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (planToEdit) {
                setTitle(planToEdit.title || '');
                setCategory(planToEdit.category || 'Activity');
                setStatus(planToEdit.status || 'Tentative');
                setDate(planToEdit.date || '');
                setTime(planToEdit.time || '');
                setLocation(planToEdit.location || '');
                setMapLink(planToEdit.mapLink || '');
                setCost(planToEdit.cost || '');
                setBookingRef(planToEdit.bookingRef || '');
                setDetails(planToEdit.details || '');
            } else {
                setTitle('');
                setCategory('Activity');
                setStatus('Tentative');
                setDate(defaultDate || '');
                setTime('');
                setLocation('');
                setMapLink('');
                setCost('');
                setBookingRef('');
                setDetails('');
            }
        }
    }, [isOpen, planToEdit, defaultDate]);

    const handleSave = async () => {
        if (!title || !date) {
            alert("Title and Date are required.");
            return;
        }

        const newPlan = {
            id: planToEdit ? planToEdit.id : `p_${Date.now()}`,
            title,
            category,
            status,
            date,
            time,
            location,
            mapLink,
            cost,
            bookingRef,
            details,
            order: planToEdit ? planToEdit.order : (activeTrip.plans?.length || 0)
        };

        const updatedTrip = { ...activeTrip };
        updatedTrip.plans = updatedTrip.plans || [];

        const existingIdx = updatedTrip.plans.findIndex(p => p.id === newPlan.id);
        if (existingIdx > -1) {
            updatedTrip.plans[existingIdx] = newPlan;
        } else {
            updatedTrip.plans.push(newPlan);
        }

        await addOrUpdateTrip(updatedTrip);
        onClose();
    };

    const handleDelete = async () => {
        if (confirm("Delete this plan?")) {
             const updatedTrip = { ...activeTrip };
             updatedTrip.plans = updatedTrip.plans.filter(p => p.id !== planToEdit.id);
             await addOrUpdateTrip(updatedTrip);
             onClose();
        }
    };

    const categories = ['Activity', 'Flight', 'Hotel', 'Food', 'Transport', 'Sightseeing'];

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex-1 overflow-y-auto min-h-0 -ml-1 pl-1 -mr-2 pr-2 pb-2 scrollbar-hide">
                <h2 className="text-2xl font-black text-[var(--text-main)] italic uppercase tracking-tighter mb-6 text-center leading-none">
                    {planToEdit ? 'Edit Plan' : 'New Plan'}
                </h2>
                <div className="space-y-5">
                    <FloatingInput label="Activity Title" value={title} onChange={(e) => setTitle(e.target.value)} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FloatingSelect label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={categories.map(c => ({value: c, label: c}))} />
                        <FloatingSelect label="Booking Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[
                            {value: 'Tentative', label: 'Tentative'},
                            {value: 'Confirmed', label: 'Confirmed'},
                            {value: 'Cancelled', label: 'Cancelled'}
                        ]} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FloatingInput type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
                        <FloatingInput type="time" label="Time" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>

                    <FloatingInput label="Location Address" value={location} onChange={(e) => setLocation(e.target.value)} />
                    <FloatingInput label="Map Link (Google Maps URL)" value={mapLink} onChange={(e) => setMapLink(e.target.value)} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FloatingInput label="Cost" value={cost} onChange={(e) => setCost(e.target.value)} />
                        <FloatingInput label="Booking Ref" value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} />
                    </div>

                    <FloatingTextarea label="Notes" value={details} onChange={(e) => setDetails(e.target.value)} />
                </div>
            </div>

            <div className="flex-shrink-0 pt-4 mt-auto">
                <div className="flex space-x-3">
                    {planToEdit && (
                        <button onClick={handleDelete} className="px-4 text-rose-500 font-bold text-sm text-center">Delete</button>
                    )}
                    <div className="flex-grow"></div>
                    <button onClick={onClose} className="px-6 py-4 text-[var(--text-muted)] font-bold hover:text-[var(--text-main)] transition-all text-sm text-center">Cancel</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-[var(--accent-blue)] text-white font-bold rounded-lg transition-all shadow-lg text-sm text-center">Save</button>
                </div>
            </div>
        </Modal>
    );
};

export default PlanModal;
