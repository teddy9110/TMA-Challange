import { useMemo } from 'react';
import css from './style.module.scss';
import cls from '../../_util/cls';

const DueDate = ({ dueDate }) => {
	const { displayText, status } = useMemo(() => {
		if (!dueDate) return { displayText: null, status: null };

		const due = new Date(dueDate);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
		const diffTime = dueDay.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const timeString = due.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});

		let displayText;

		if (diffDays < 0) {
			// is Overdue?
			if (diffDays === -1) {
				displayText = `Yesterday at ${timeString}`;
			} else {
				displayText = `${Math.abs(diffDays)} days ago at ${timeString}`;
			}
		} else if (diffDays === 0) {
			// Today?
			displayText = `Today at ${timeString}`;
		} else if (diffDays === 1) {
			// Tomorrow?
			displayText = `Tomorrow at ${timeString}`;
		} else if (diffDays <= 6) {
			// This week?
			const dayName = due.toLocaleDateString('en-US', { weekday: 'long' });
			displayText = `${dayName} at ${timeString}`;
		} else {
			// Future dates
			const dateString = due.toLocaleDateString('en-US', {
				day: 'numeric',
				month: 'long'
			});
			displayText = `${dateString} at ${timeString}`;
		}

		let status;
		if (diffDays < 0) {
			status = 'overdue';
		} else if (diffDays <= 1) {
			status = 'due-soon';
		} else {
			status = 'upcoming';
		}

		return { displayText, status };
	}, [dueDate]);

	if (!displayText) return null;

	return (
		<div className={cls(css.dueDate, css[status])}>
			{displayText}
		</div>
	);
};

export default DueDate;
