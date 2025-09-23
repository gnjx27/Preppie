// Emergency contact numbers by category (used wherever emergency numbers are needed)
export type EmergencyNumbersType = {
    ambulance: string[];
    fire: string[];
    police: string[];
    dispatch: string[];
    notes: string | false;
}

// Badge Type
export type Badge = {
    id: string;
    title: string;
    description: string;
    icon: string;
    pointsRequired: number;
};

// Represents a single quiz option
export type QuizOption = {
    text: string;
    isCorrect: boolean;
    explanation?: string;
}

// Represents a single question
export type QuizQuestion = {
    question: string;
    options: QuizOption[];
}

// Represents a quiz - used in quiz screens and data fetching
export type Quiz = {
    id: string;
    title: string;
    type: 'disaster' | 'first-aid';
    disasterType?: string;
    questions: QuizQuestion[];
};

// Quiz Result
export type QuizResult = {
    score: number;
    isCompleted: boolean;
    completedTimestamp: string | null;
}

// Quiz with score
export type QuizWithScore = Quiz & {
    score?: number;
    isCompleted?: boolean;
    completedTimestamp?: string | null;
}

// Represents a checklist - used in checklist screens and data fetching
export type Checklist = {
    id: string;
    title: string;
    type: 'one-time' | 'recurring';
    frequency?: 'none' | 'weekly' | 'monthly';
    description?: string;
    items: string[];
};

// Combines checklist with status ("Completed", "In Progress", "Not Started")
export interface ChecklistWithStatus extends Checklist {
    status: string;
}

// Combines recurring checklists with completed periods (used in homescreen)
export interface RecurringChecklistWithProgress extends Checklist {
    completedPeriods: string[];
}

// Represent an emergency guide - used in emergency guide screens and data fetching
export type EmergencyGuide = {
    title: string;
    disasterType: string;
    description: string[];
    imageKey: string;
    before: EmergencyGuideStep[];
    during: EmergencyGuideStep[];
    after: EmergencyGuideStep[];
}

// Represents a step in an emergency guide
export type EmergencyGuideStep = {
  step: string;
  notes: string[];
};

