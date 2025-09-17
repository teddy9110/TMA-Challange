import { useState } from 'react';
import Task from './_components/Task';
import { AnimatePresence, AnimateSharedLayout, motion } from 'framer-motion';
import Wrap from './_components/Wrap';
import Header from './_components/Header';
import Input from './_components/Input';
import Empty from './_components/Empty';
import SubHeader from './_components/SubHeader';
import { gql, useMutation, useQuery } from '@apollo/client';
import Spin from './_components/Spin';

export default function App () {
	const [hasFocus, setHasFocus] = useState(false)
		, [busy, setBusy] = useState(false);

	const { data, loading, error, refetch } = useQuery(gql`
        query {
            active: tasks (
                filter: { complete: { equalTo: false } }
                orderBy: [DUE_DATE_ASC, CREATED_AT_ASC]
            ) {
                nodes {
                    ...Task
                }
            }
            complete: tasks (
                filter: { complete: { equalTo: true } }
                orderBy: [COMPLETED_AT_ASC]
            ) {
                nodes {
                    ...Task
                }
            }
        }
        fragment Task on Task {
            id
            text
            complete
            dueDate
            createdAt
        }
    `);

	const [create] = useMutation(gql`
        mutation Create ($text: String!, $dueDate: Datetime) {
            createTask (input: { task: { text: $text, dueDate: $dueDate } }) {
                task {
                    id
                    text
                    complete
                    dueDate
                    createdAt
                }
            }
        }
    `);

	const [complete] = useMutation(gql`
        mutation Complete ($id: UUID!) {
            complete (input: { id: $id }) {
                task {
                    id
                    text
                    complete
                    dueDate
                    createdAt
                    completedAt
                }
            }
        }
    `);

	const [uncomplete] = useMutation(gql`
        mutation Uncomplete ($id: UUID!) {
            uncomplete (input: { id: $id }) {
                task {
                    id
                    text
                    complete
                    dueDate
                    createdAt
                }
            }
        }
    `);

	const onSubmit = async ({text, dateTime}) => {
		setBusy(true);
		const dueDate = dateTime ? new Date(dateTime).toISOString() : null;

		await create({
			variables: {
				text,
				dueDate: dueDate
			},
			optimisticResponse: {
				__typename: 'Mutation',
				createTask: {
					__typename: 'CreateTaskPayload',
					task: {
						__typename: 'Task',
						id: Math.random().toString(),
						text,
						complete: false,
						dueDate: dueDate,
						createdAt: new Date().toISOString()
					}
				},
			},
			update: (cache, { data }) => {
				// Update the cache with the new task
				const existingData = cache.readQuery({
					query: gql`
					query {
						active: tasks (
							filter: { complete: { equalTo: false } }
							orderBy: [CREATED_AT_ASC]
						) {
							nodes {
								id
								text
								complete
								dueDate
								createdAt
							}
						}
					}
				`
				});

				if (existingData && data.createTask.task) {
					cache.writeQuery({
						query: gql`
						query {
							active: tasks (
								filter: { complete: { equalTo: false } }
								orderBy: [CREATED_AT_ASC]
							) {
								nodes {
									id
									text
									complete
									dueDate
									createdAt
								}
							}
						}
					`,
						data: {
							active: {
								...existingData.active,
								nodes: [...existingData.active.nodes, data.createTask.task]
							}
						}
					});
				}
			}
		});

		await refetch();
		setBusy(false);
	};


	const renderTask = t => (
		<Task
			key={t.id}
			text={t.text}
			complete={t.complete}
			dueDate={t.dueDate}
			onChange={async checked => {
				setBusy(true);
				if (checked) {
					await complete({
						variables: { id: t.id },
						optimisticResponse: {
							__typename: 'Mutation',
							complete: {
								__typename: 'CompletePayload',
								task: {
									...t,
									__typename: 'Task',
									complete: true,
									completedAt: new Date().toISOString()
								}
							}
						},
					});
				}
				else {
					await uncomplete({
						variables: { id: t.id },
						optimisticResponse: {
							__typename: 'Mutation',
							uncomplete: {
								__typename: 'UncompletePayload',
								task: {
									...t,
									__typename: 'Task',
									complete: false,
								}
							}
						},
					});
				}

				await refetch();
				setBusy(false);
			}}
			layoutId={t.id}
		/>
	);

	const activeTasks = data && data.active ? data.active.nodes : []
		, completeTasks = data && data.complete ? data.complete.nodes: [];

	const hasTasks = activeTasks.length + completeTasks.length > 0;

	return (
		<Wrap>
			<Spin show={loading || busy} />
			<Header>
				<h1>Launch Checklist</h1>
				<p>List of pre-launch tasks for my big project.</p>
			</Header>

			<Input
				onSubmit={onSubmit}
				onFocusChange={setHasFocus}
			/>

			<AnimatePresence>
				{error && (
					<Empty error>
						<p>🤬 {error.message}</p>
					</Empty>
				)}
			</AnimatePresence>

			<AnimateSharedLayout>
				<motion.div
					animate={hasFocus ? 'from' : 'to'}
					variants={{
						from: { opacity: 0.4 },
						to:   { opacity: 1 },
					}}
				>
					<AnimatePresence>
						{!hasTasks && (
							<Empty>
								<p>😲 You haven't added any tasks!</p>
							</Empty>
						)}
					</AnimatePresence>

					<AnimatePresence>
						{hasTasks && activeTasks.length === 0 && (
							<Empty>
								<p>🎉 You've completed all your tasks!</p>
							</Empty>
						)}
					</AnimatePresence>
					{activeTasks.map(renderTask)}

					<AnimatePresence>
						{hasTasks && (
							<SubHeader>Completed Tasks</SubHeader>
						)}
					</AnimatePresence>
					{completeTasks.map(renderTask)}
					<AnimatePresence>
						{hasTasks && completeTasks.length === 0 && (
							<Empty>
								<p>🏃 Better get going!</p>
							</Empty>
						)}
					</AnimatePresence>
				</motion.div>
			</AnimateSharedLayout>
		</Wrap>
	);
}
