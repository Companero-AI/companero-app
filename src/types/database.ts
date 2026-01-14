// Puzzle piece types
export type PieceType = 'purpose' | 'customers' | 'boundaries' | 'features' | 'mvp';

export type PieceStatus = 'locked' | 'available' | 'in_progress' | 'complete';

// Metadata for each puzzle piece type
export const PIECE_METADATA: Record<PieceType, {
  title: string;
  description: string;
  icon: string;
  order: number;
  prerequisites: PieceType[];
}> = {
  purpose: {
    title: 'Purpose & Vision',
    description: 'Define why your product exists and what problem it solves',
    icon: '🎯',
    order: 1,
    prerequisites: [],
  },
  customers: {
    title: 'Target Customers',
    description: 'Identify who will use and benefit from your product',
    icon: '👥',
    order: 2,
    prerequisites: ['purpose'],
  },
  boundaries: {
    title: 'Scope & Boundaries',
    description: 'Clarify what your product will and will not do',
    icon: '🔲',
    order: 3,
    prerequisites: ['purpose', 'customers'],
  },
  features: {
    title: 'Core Features',
    description: 'Define the key capabilities your product needs',
    icon: '⚡',
    order: 4,
    prerequisites: ['purpose', 'customers', 'boundaries'],
  },
  mvp: {
    title: 'MVP Definition',
    description: 'Determine the minimum viable version to launch',
    icon: '🚀',
    order: 5,
    prerequisites: ['purpose', 'customers', 'boundaries', 'features'],
  },
};

// Database entity types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PuzzlePiece {
  id: string;
  project_id: string;
  piece_type: PieceType;
  status: PieceStatus;
  content: Record<string, unknown> | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  piece_id: string | null;
  piece_type: PieceType | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

// Insert types (without auto-generated fields)
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type PuzzlePieceInsert = Omit<PuzzlePiece, 'id' | 'created_at' | 'updated_at'>;
export type ConversationInsert = Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;
export type MessageInsert = Omit<Message, 'id' | 'created_at'>;

// Update types (partial updates)
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>;
export type PuzzlePieceUpdate = Partial<Omit<PuzzlePiece, 'id' | 'project_id' | 'piece_type' | 'created_at'>>;

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      puzzle_pieces: {
        Row: PuzzlePiece;
        Insert: PuzzlePieceInsert;
        Update: PuzzlePieceUpdate;
      };
      conversations: {
        Row: Conversation;
        Insert: ConversationInsert;
        Update: Record<string, never>;
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: Record<string, never>;
      };
    };
  };
}
