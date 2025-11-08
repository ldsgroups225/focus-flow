'use client';

import React, { Activity, ViewTransition } from 'react';
import { useState, createContext, useContext } from 'react';

/**
 * Activity Component Utilities
 * Preserves component state when hidden, perfect for modals, tabs, and conditional rendering
 */

const ModalContext = createContext<{
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
} | null>(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

/**
 * Modal Manager using Activity component
 * Preserves form data and state when modal is closed
 */
export const ModalManager: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (modalId: string) => {
    setActiveModal(modalId);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // Context for modal management
  const ModalContextValue = {
    activeModal,
    openModal,
    closeModal,
  };

  return (
    <ModalContext.Provider value={ModalContextValue}>
      <div className="modal-manager">
        {/* Main Content - Hidden when modal is active */}
        <Activity mode={activeModal ? 'hidden' : 'visible'}>
          {children}
        </Activity>

        {/* Modal Overlay - Uses ViewTransition for smooth animations */}
        {activeModal && (
          <ViewTransition>
            <ModalOverlay modalId={activeModal} onClose={closeModal} />
          </ViewTransition>
        )}
      </div>
    </ModalContext.Provider>
  );
};

/**
 * Modal Overlay component with Activity
 */
const ModalOverlay: React.FC<{
  modalId: string;
  onClose: () => void;
}> = ({ modalId, onClose }) => {
  return (
    <Activity mode="visible">
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <ModalContent modalId={modalId} />
        </div>
      </div>
    </Activity>
  );
};

/**
 * Modal Content - State is preserved when hidden
 */
interface TaskFormState {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

const ModalContent: React.FC<{ modalId: string }> = ({ modalId }) => {
  // This component's state is preserved when Activity hides it
  const [formData, setFormData] = useState<TaskFormState>({
    title: '',
    description: '',
    priority: 'medium',
  });

  const contentMap: Record<string, { title: string; content: React.ReactNode }> = {
    'task-form': {
      title: 'Create Task',
      content: (
        <TaskForm
          formData={formData}
          setFormData={setFormData}
        />
      ),
    },
    'ai-review': {
      title: 'AI Review',
      content: <AIReviewForm />,
    },
    'settings': {
      title: 'Settings',
      content: <SettingsForm />,
    },
  };

  const content = contentMap[modalId];

  if (!content) return null;

  return (
    <div className="modal-content-inner">
      <header className="modal-header">
        <h2>{content.title}</h2>
        <button onClick={() => {}}>&times;</button>
      </header>
      <div className="modal-body">{content.content}</div>
    </div>
  );
};

/**
 * Task Form with preserved state
 */
interface TaskFormProps {
  formData: TaskFormState;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormState>>;
}

const TaskForm: React.FC<TaskFormProps> = ({ formData, setFormData }) => {
  const handlePriorityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    if (value === 'low' || value === 'medium' || value === 'high') {
      setFormData(prev => ({ ...prev, priority: value }));
    }
  };

  return (
    <form className="task-form">
      <div className="form-group">
        <label>Title:</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter task title..."
        />
      </div>

      <div className="form-group">
        <label>Description:</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter task description..."
        />
      </div>

      <div className="form-group">
        <label>Priority:</label>
        <select
          value={formData.priority}
          onChange={handlePriorityChange}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <button type="submit">Save Task</button>
    </form>
  );
};

const AIReviewForm: React.FC = () => {
  const [reviewText, setReviewText] = useState('');

  return (
    <div className="ai-review-form">
      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Enter text for AI review..."
        rows={5}
      />
      <button onClick={() => {}}>Generate Review</button>
    </div>
  );
};

interface SettingsState {
  notifications: boolean;
  emailUpdates: boolean;
}

const SettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    notifications: true,
    emailUpdates: false,
  });

  return (
    <div className="settings-form">
      <label>
        <input
          type="checkbox"
          checked={settings.notifications}
          onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
        />
        Enable notifications
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.emailUpdates}
          onChange={(e) => setSettings(prev => ({ ...prev, emailUpdates: e.target.checked }))}
        />
        Email updates
      </label>
    </div>
  );
};

/**
 * Tab Interface with Activity - State preserved when switching tabs
 */
export interface PreservedTabConfig {
  id: string;
  label: string;
  content: React.ReactNode;
}

const PreservedTabs: React.FC<{ tabs: PreservedTabConfig[] }> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="preserved-tabs">
      <nav className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {tabs.map(tab => (
          <Activity
            key={tab.id}
            mode={activeTab === tab.id ? 'visible' : 'hidden'}
          >
            <div className="tab-panel">
              {tab.content}
            </div>
          </Activity>
        ))}
      </div>
    </div>
  );
};

/**
 * Conditional Content with Activity
 * Useful for showing/hiding sections while preserving state
 */
export const ConditionalSection: React.FC<{
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isVisible, children, className }) => {
  return (
    <Activity mode={isVisible ? 'visible' : 'hidden'}>
      <div className={className}>
        {children}
      </div>
    </Activity>
  );
};

/**
 * Pre-rendering wrapper with Activity
 * Pre-renders content in the background
 */
export const PreRenderedContent: React.FC<{
  isActive: boolean;
  children: React.ReactNode;
}> = ({ isActive, children }) => {
  return (
    <Activity mode={isActive ? 'visible' : 'hidden'}>
      {children}
    </Activity>
  );
};
