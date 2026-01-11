import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { formatDate } from '../../utils/date';

const PlanViewModal = ({ isOpen, onClose, plan, onEdit }) => {
    // SMART LINK FIX: Mobile detection to prevent white screen on Android PWA
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            return /android|ipad|iphone|ipod/i.test(userAgent);
        };
        setIsMobile(checkMobile());
    }, []);

    if (!plan) return null;

    const statusColors = {
        'Confirmed': 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
        'Tentative': 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
        'Cancelled': 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
    };

    // On mobile, we remove target="_blank" to allow native app intent interception
    // On desktop, we keep it to open in a new tab
    const targetAttr = isMobile ? undefined : "_blank";
    const relAttr = isMobile ? undefined : "noopener noreferrer";

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex-1 overflow-y-auto min-h-0 -ml-1 pl-1 -mr-2 pr-2 scrollbar-hide">
                <div className="flex justify-between items-start mb-6 w-full">
                    <div className="min-w-0 pr-2">
                        <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest block mb-1">
                            {plan.category || 'Plan'}
                        </span>
                        <h2 className="text-2xl font-black text-[var(--text-main)] italic uppercase tracking-tighter break-words leading-none">
                            {plan.title || ''}
                        </h2>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border flex-shrink-0 ${statusColors[plan.status] || statusColors['Tentative']}`}>
                        {plan.status || 'Tentative'}
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--card-border)]">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center mr-3 flex-shrink-0">
                            <i className="fa-solid fa-calendar-day text-xs"></i>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-none mb-1">Date & Time</p>
                            <p className="text-sm font-semibold text-[var(--text-main)] break-words">
                                {formatDate(plan.date)} {plan.time ? `at ${plan.time}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--card-border)]">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center mr-3 flex-shrink-0">
                            <i className="fa-solid fa-location-dot text-xs"></i>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-none mb-1">Location Address</p>
                            <p className="text-sm font-semibold text-[var(--text-main)] break-words">
                                {plan.location || 'Not specified'}
                            </p>
                        </div>
                    </div>

                    {plan.mapLink && (
                        <a href={plan.mapLink} target={targetAttr} rel={relAttr} className="flex items-center p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--card-border)]">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center mr-3 flex-shrink-0">
                                <i className="fa-solid fa-map-location-dot text-xs"></i>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-none mb-1">View on Map</p>
                                <p className="text-sm font-semibold text-[var(--accent-blue)] break-words">
                                    Open Link <i className="fa-solid fa-arrow-up-right-from-square ml-1 text-xs opacity-50"></i>
                                </p>
                            </div>
                        </a>
                    )}

                    {plan.location && (
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(plan.location)}&travelmode=transit`} target={targetAttr} rel={relAttr} className="flex items-center p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--card-border)]">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center mr-3 flex-shrink-0">
                                <i className="fa-solid fa-train-subway text-xs"></i>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-none mb-1">Transit Directions</p>
                                <p className="text-sm font-semibold text-[var(--accent-blue)] break-words">
                                    Get Directions <i className="fa-solid fa-arrow-up-right-from-square ml-1 text-xs opacity-50"></i>
                                </p>
                            </div>
                        </a>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--card-border)]">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center mr-3 flex-shrink-0">
                                <i className="fa-solid fa-receipt text-xs"></i>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-none mb-1">Cost</p>
                                <p className="text-sm font-semibold text-[var(--text-main)] break-all">
                                    {plan.cost || '-'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--card-border)]">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center mr-3 flex-shrink-0">
                                <i className="fa-solid fa-ticket text-xs"></i>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-none mb-1">Booking Ref</p>
                                <p className="text-sm font-semibold text-[var(--text-main)] break-all">
                                    {plan.bookingRef || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--card-border)]">
                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-none mb-1">Notes</p>
                        <p className="text-sm italic text-[var(--text-main)] break-words whitespace-pre-wrap">
                            {plan.details || 'No additional notes provided.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 pt-4 mt-auto">
                <div className="flex space-x-3">
                    <button onClick={onClose} className="flex-1 py-4 text-[var(--text-muted)] font-bold hover:text-[var(--text-main)] transition-all text-sm text-center">
                        Close
                    </button>
                    <button onClick={() => onEdit(plan)} className="flex-1 py-4 bg-[var(--accent-blue)] text-white font-bold rounded-lg shadow-lg text-sm text-center">
                        Edit Plan
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PlanViewModal;
