import css from './style.module.scss';
import cls from '../../_util/cls';
import { motion } from 'framer-motion';
import DueDate from '../DueDate';

export default function Task ({complete, text, dueDate, onChange, ...props }) {
	const _onChange = e => onChange(!!e.target.checked);

	return (
		<motion.label
			layout
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className={cls(css.task, {
				[css.checked]: complete,
			})}
			{...props}
		>
			<input
				type="checkbox"
				onChange={_onChange}
				defaultChecked={complete}
			/>
			<span className={css.check} />
			<div className={css.content}>
				<span className={css.text}>{text}</span>
				<DueDate dueDate={dueDate} />
			</div>
		</motion.label>
	);
}
