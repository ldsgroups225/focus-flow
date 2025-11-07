
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Task, SubTask } from '@/lib/types';

type RawTask = Omit<Task, 'dueDate' | 'completedDate'> & {
  dueDate?: Timestamp;
  completedDate?: Timestamp;
  createdAt: Timestamp;
};

// Mapper to convert Firestore Timestamps to JS Dates
const mapTaskFromFirebase = (docData: RawTask, id: string): Task => {
  const { dueDate, completedDate, ...rest } = docData;
  return {
    id,
    ...rest,
    dueDate: dueDate?.toDate(),
    completedDate: completedDate?.toDate(),
  };
};

// Get all tasks for a user with real-time updates
export const getTasks = (
  userId: string,
  callback: (tasks: Task[]) => void
) => {
  const tasksCollection = collection(db, `users/${userId}/tasks`);
  const q = query(tasksCollection);

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs.map(doc => 
      mapTaskFromFirebase(doc.data() as RawTask, doc.id)
    );
    callback(tasks);
  });

  return unsubscribe;
};

// Add a new task
export const addTask = async (userId: string, taskData: Omit<Task, 'id' | 'completed' | 'completedPomodoros' | 'timeSpent' | 'completedDate'>) => {
  const tasksCollection = collection(db, `users/${userId}/tasks`);
  const newTask = {
    ...taskData,
    completed: false,
    completedPomodoros: 0,
    timeSpent: 0,
    completedDate: undefined,
    createdAt: serverTimestamp(),
  };
  await addDoc(tasksCollection, newTask);
};

// Update an existing task
export const updateTask = async (userId: string, taskId: string, taskData: Partial<Task>) => {
  const taskDoc = doc(db, `users/${userId}/tasks`, taskId);
  await updateDoc(taskDoc, taskData);
};

// Delete a task
export const deleteTask = async (userId: string, taskId: string) => {
  const taskDoc = doc(db, `users/${userId}/tasks`, taskId);
  await deleteDoc(taskDoc);
};
