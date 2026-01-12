export const formatDate = (dateStr) => {
    if (!dateStr) return 'Select Date';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

export const getDaysArray = (start, end) => {
    let days = [];
    let current = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');

    if (isNaN(current.getTime()) || isNaN(endDate.getTime()) || current > endDate) {
        if (start) days.push(start);
        return days;
    }

    let safety = 0;
    while(current <= endDate && safety < 366) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        days.push(`${y}-${m}-${d}`);
        current.setDate(current.getDate() + 1);
        safety++;
    }
    return days;
};
