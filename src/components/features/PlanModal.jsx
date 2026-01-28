import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import FloatingInput from '../ui/FloatingInput';
import FloatingSelect from '../ui/FloatingSelect';
import FloatingTextarea from '../ui/FloatingTextarea';
import { useTrip } from '../../context/TripContext';

const PlanModal = ({ isOpen, onClose, onSave, onDelete, planToEdit, defaultDate }) => {
    const { activeTrip, addOrUpdateTrip } = useTrip();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [validationError, setValidationError] = useState(null);

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

    // Initial state for dirty check
    const [initialState, setInitialState] = useState({});

    // Confirmation Modals
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    // State to track if the Notes field is focused
    const [isNotesFocused, setIsNotesFocused] = useState(false);
    // Ref for the scrollable container
    const scrollContainerRef = useRef(null);

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

                setInitialState({
                    title: planToEdit.title || '',
                    category: planToEdit.category || 'Activity',
                    status: planToEdit.status || 'Tentative',
                    date: planToEdit.date || '',
                    time: planToEdit.time || '',
                    location: planToEdit.location || '',
                    mapLink: planToEdit.mapLink || '',
                    cost: planToEdit.cost || '',
                    bookingRef: planToEdit.bookingRef || '',
                    details: planToEdit.details || ''
                });
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

                setInitialState({
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
            }
            setValidationError(null);
            setShowSaveConfirm(false);
            setShowDiscardConfirm(false);
        }
    }, [isOpen, planToEdit, defaultDate]);

    // Auto-scroll to bottom when notes expand while focused
    useEffect(() => {
        if (isNotesFocused && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [details, isNotesFocused]);

    const checkDirty = () => {
        if (title !== initialState.title) return true;
        if (category !== initialState.category) return true;
        if (status !== initialState.status) return true;
        if (date !== initialState.date) return true;
        if (time !== initialState.time) return true;
        if (location !== initialState.location) return true;
        if (mapLink !== initialState.mapLink) return true;
        if (cost !== initialState.cost) return true;
        if (bookingRef !== initialState.bookingRef) return true;
        if (details !== initialState.details) return true;
        return false;
    };

    const handleSaveRequest = () => {
        const missingFields = [];
        if (!title) missingFields.push("Activity Title");

        if (missingFields.length > 0) {
            setValidationError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
            return;
        }

        if (checkDirty()) {
            setShowSaveConfirm(true);
        } else {
            // No changes, just close
            onClose();
        }
    };

    const executeSave = async () => {
        const newPlan = {
            id: planToEdit ? planToEdit.id : `p_${Date.now()}`,
            title,
            category,
            status,
            date, // Note: If date is empty, it might not appear in a DayGroup unless logic handles unscheduled items.
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
        setShowSaveConfirm(false);
        if (onSave) {
            onSave(newPlan);
        } else {
            onClose();
        }
    };

    const handleCancelRequest = () => {
        if (checkDirty()) {
            setShowDiscardConfirm(true);
        } else {
            onClose();
        }
    };

    const handleDelete = async () => {
         const updatedTrip = { ...activeTrip };
         updatedTrip.plans = updatedTrip.plans.filter(p => p.id !== planToEdit.id);
         await addOrUpdateTrip(updatedTrip);
         setShowDeleteConfirm(false);
         if (onDelete) {
             onDelete();
         } else {
             onClose();
         }
    };

    const categories = ['Activity', 'Flight', 'Hotel', 'Food', 'Transport', 'Sightseeing'];

    return (
        <Modal isOpen={isOpen} onClose={handleCancelRequest}>
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto min-h-0 -ml-1 pl-1 -mr-2 pr-2 pb-2 scrollbar-hide"
            >
                <h2 className="text-2xl font-black text-[var(--text-main)] italic uppercase tracking-tighter mb-6 text-center leading-none">
                    {planToEdit ? 'Edit Plan' : 'New Plan'}
                </h2>
                <div className="space-y-3">
                    <FloatingInput label="Activity Title" value={title} onChange={(e) => setTitle(e.target.value)} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FloatingSelect label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={categories.map(c => ({value: c, label: c}))} />
                        <FloatingSelect label="Booking Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[
                            {value: 'Tentative', label: 'Tentative'},
                            {value: 'Confirmed', label: 'Confirmed'},
                            {value: 'Cancelled', label: 'Cancelled'}
                        ]} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <FloatingInput type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
                        <FloatingInput type="time" label="Time" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>

                    <FloatingInput label="Location Address" value={location} onChange={(e) => setLocation(e.target.value)} />
                    <FloatingInput label="Map Link (Google Maps URL)" value={mapLink} onChange={(e) => setMapLink(e.target.value)} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FloatingInput label="Cost" value={cost} onChange={(e) => setCost(e.target.value)} />
                        <FloatingInput label="Booking Ref" value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} />
                    </div>

                    <FloatingTextarea
                        label="Notes"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        onFocus={() => setIsNotesFocused(true)}
                        onBlur={() => setIsNotesFocused(false)}
                    />
                </div>
            </div>

            <div className="flex-shrink-0 pt-4 mt-auto">
                <div className="flex space-x-3">
                    {planToEdit && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="px-4 text-rose-500 font-bold text-sm text-center">Delete</button>
                    )}
                    <div className="flex-grow"></div>
                    <button onClick={handleCancelRequest} className="px-6 py-4 text-[var(--text-muted)] font-bold hover:text-[var(--text-main)] transition-all text-sm text-center">Cancel</button>
                    <button onClick={handleSaveRequest} className="px-8 py-3 bg-[var(--accent-blue)] text-white font-bold rounded-lg transition-all shadow-lg text-sm text-center">Save</button>
                </div>
            </div>

            {/* Validation Alert */}
            <ConfirmationModal
                isOpen={!!validationError}
                onClose={() => setValidationError(null)}
                onConfirm={() => setValidationError(null)}
                title="Missing Information"
                message={validationError}
                confirmText="OK"
                showCancel={false}
                variant="warning"
            />

            {/* Save Confirmation */}
            <ConfirmationModal
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={executeSave}
                title="Save Changes?"
                message="Are you sure you want to save these changes?"
                confirmText="Save"
                cancelText="Cancel"
                variant="info"
            />

            {/* Discard Confirmation */}
            <ConfirmationModal
                isOpen={showDiscardConfirm}
                onClose={() => setShowDiscardConfirm(false)}
                onConfirm={onClose}
                title="Discard Changes?"
                message="You have unsaved changes. Are you sure you want to discard them?"
                confirmText="Discard"
                cancelText="Keep Editing"
                variant="warning"
            />

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Remove Plan?"
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </Modal>
    );
};

export default PlanModal;
