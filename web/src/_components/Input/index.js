import { useState, useRef, useEffect } from 'react';
import css from './style.module.scss';
import cls from '../../_util/cls';

const formatTaskDate = dateString => {
	if (!dateString) return '';
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
};

export default function TaskInput({ onFocusChange = () => {}, onSubmit = () => {} }) {
	const [isInputFocused, setInputFocused] = useState(false);
	const [taskDueDate, setTaskDueDate] = useState('');
	const [isCalendarOpen, setCalendarOpen] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedTime, setSelectedTime] = useState({ hours: 12, minutes: 0, period: 'PM' });

	const calendarRef = useRef(null);
	const dateButtonRef = useRef(null);
	const inputRef = useRef(null);

	const handleFocus = isNowFocused => {
		setInputFocused(isNowFocused);
		onFocusChange(isNowFocused);
	};

	const handleBlur = () => {
		setTimeout(() => {
			if (!calendarRef.current?.contains(document.activeElement)) {
				handleFocus(inputRef.current?.value.trim() !== '');
				setCalendarOpen(false);
			}
		}, 100);
	};

	const handleResize = e => {
		e.target.style.height = 'auto';
		e.target.style.height = e.target.scrollHeight + 'px';
	};

	const handleSubmit = async e => {
		if (e.key !== 'Enter') return;

		e.preventDefault();
		const taskDetails = {
			text: e.target.value,
			dueDate: taskDueDate
		};
		await onSubmit(taskDetails);

		e.target.value = '';
		setTaskDueDate('');
		handleResize(e);
		e.target.blur();
	};

	const handlePaste = e => {
		e.preventDefault();
		const pastedText = e.clipboardData.getData('text');
		e.target.value = pastedText.replace(/\s+/g, ' ');
		handleResize(e);
	};

	const toggleCalendar = () => {
		setCalendarOpen(prev => !prev);
	};

	const combineDateAndTime = (date, time) => {
		const newDate = new Date(date);
		let hours = time.hours;
		if (time.period === 'AM' && hours === 12) {
			hours = 0;
		} else if (time.period === 'PM' && hours !== 12) {
			hours += 12;
		}
		newDate.setHours(hours, time.minutes, 0, 0);
		return newDate;
	};

	const handleDateSelect = date => {
		const combinedDateTime = combineDateAndTime(date, selectedTime);
		setTaskDueDate(combinedDateTime.toISOString());
	};

	const handleTimeChange = (field, value) => {
		const newTime = { ...selectedTime, [field]: parseInt(value) || value };
		setSelectedTime(newTime);
		if (taskDueDate) {
			const currentDate = new Date(taskDueDate);
			const combinedDateTime = combineDateAndTime(currentDate, newTime);
			setTaskDueDate(combinedDateTime.toISOString());
		}
	};

	const setTimeToNow = () => {
		const now = new Date();
		const hours = now.getHours();
		const minutes = now.getMinutes();
		setSelectedTime({
			hours: hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours),
			minutes: Math.round(minutes / 15) * 15,
			period: hours >= 12 ? 'PM' : 'AM'
		});
	};

	useEffect(() => {
		const handleOutsideClick = event => {
			if (
				calendarRef.current &&
				!calendarRef.current.contains(event.target) &&
				dateButtonRef.current &&
				!dateButtonRef.current.contains(event.target)
			) {
				setCalendarOpen(false);
			}
		};

		document.addEventListener('mousedown', handleOutsideClick);
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	}, []);

	const getMonthDays = () => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const firstDayOfMonth = new Date(year, month, 1);
		const startDate = new Date(firstDayOfMonth);
		startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

		const days = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = 0; i < 42; i++) {
			const day = new Date(startDate);
			day.setDate(startDate.getDate() + i);
			const isSelected = taskDueDate && day.toISOString().split('T')[0] === new Date(taskDueDate).toISOString().split('T')[0];

			days.push({
				date: day,
				isFromCurrentMonth: day.getMonth() === month,
				isToday: day.getTime() === today.getTime(),
				isSelected,
				dayNumber: day.getDate()
			});
		}
		return days;
	};

	const navigateMonth = direction => {
		const newMonth = new Date(currentMonth);
		newMonth.setMonth(currentMonth.getMonth() + direction);
		setCurrentMonth(newMonth);
	};

	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June', 'July',
		'August', 'September', 'October', 'November', 'December'
	];
	const hourOptions = Array.from({ length: 12 }, (_, hour) => hour + 1);
	const minuteOptions = Array.from({ length: 4 }, (_, min) => min * 15);

	return (
		<div className={cls(css.wrap, { [css.focus]: isInputFocused })}>
			<div className={css.inputContainer}>
             <textarea
				 ref={inputRef}
				 rows={1}
				 className={css.input}
				 onInput={handleResize}
				 placeholder="What's your task?"
				 onFocus={() => handleFocus(true)}
				 onBlur={handleBlur}
				 onKeyPress={handleSubmit}
				 onPaste={handlePaste}
			 />

				<div className={css.datePickerContainer}>
					{taskDueDate && (
						<span className={css.dateDisplay}>{formatTaskDate(taskDueDate)}</span>
					)}
					<button
						ref={dateButtonRef}
						type="button"
						className={cls(css.dateIcon, { [css.active]: taskDueDate || isCalendarOpen })}
						onClick={toggleCalendar}
						onMouseDown={e => e.preventDefault()}
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
							<path d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z" />
							<path d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2zM19 8l.001 12H5V8h14z" />
						</svg>
					</button>
				</div>

				{isCalendarOpen && (
					<div ref={calendarRef} className={css.datePickerDropdown}>
						<div className={css.datePickerHeader}>
							<button type="button" onClick={() => navigateMonth(-1)} className={css.navButton}>‹</button>
							<span className={css.monthYear}>
                         {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
							<button type="button" onClick={() => navigateMonth(1)} className={css.navButton}>›</button>
						</div>

						<div className={css.weekDays}>
							{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
								<div key={day} className={css.weekDay}>{day}</div>
							))}
						</div>

						<div className={css.calendar}>
							{getMonthDays().map((day, index) => (
								<button
									key={index}
									type="button"
									className={cls(css.calendarDay, {
										[css.otherMonth]: !day.isFromCurrentMonth,
										[css.today]: day.isToday,
										[css.selected]: day.isSelected
									})}
									onClick={() => handleDateSelect(day.date)}
								>
									{day.dayNumber}
								</button>
							))}
						</div>
						<div className={css.timePicker}>
							<div className={css.timeControls}>
								<button
									type="button"
									className={css.currentTimeBtn}
									onClick={setTimeToNow}
								>
									Now
								</button>

								<select
									value={selectedTime.hours}
									onChange={e => handleTimeChange('hours', e.target.value)}
									className={css.timeSelect}
								>
									{hourOptions.map(hour => (
										<option key={hour} value={hour}>{hour}</option>
									))}
								</select>

								<select
									value={selectedTime.minutes}
									onChange={e => handleTimeChange('minutes', e.target.value)}
									className={css.timeSelect}
								>
									{minuteOptions.map(minute => (
										<option key={minute} value={minute}>
											{minute.toString().padStart(2, '0')}
										</option>
									))}
								</select>

								<select
									value={selectedTime.period}
									onChange={e => handleTimeChange('period', e.target.value)}
									className={css.timeSelect}
								>
									<option value="AM">AM</option>
									<option value="PM">PM</option>
								</select>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
