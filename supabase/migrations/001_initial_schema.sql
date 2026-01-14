-- Companero MVP Database Schema
-- This migration creates the core tables for product planning

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table: Each user can have multiple product planning projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Puzzle pieces table: Each project has 5 puzzle pieces
CREATE TYPE piece_type AS ENUM ('purpose', 'customers', 'boundaries', 'features', 'mvp');
CREATE TYPE piece_status AS ENUM ('locked', 'available', 'in_progress', 'complete');

CREATE TABLE puzzle_pieces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    piece_type piece_type NOT NULL,
    status piece_status NOT NULL DEFAULT 'locked',
    content JSONB,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, piece_type)
);

-- Conversations table: Each puzzle piece can have conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    piece_id UUID REFERENCES puzzle_pieces(id) ON DELETE SET NULL,
    piece_type piece_type,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table: Stores the chat history
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_puzzle_pieces_project_id ON puzzle_pieces(project_id);
CREATE INDEX idx_conversations_project_id ON conversations(project_id);
CREATE INDEX idx_conversations_piece_id ON conversations(piece_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_puzzle_pieces_updated_at
    BEFORE UPDATE ON puzzle_pieces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only access their own projects
CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- Puzzle pieces: Access through project ownership
CREATE POLICY "Users can view puzzle pieces of own projects"
    ON puzzle_pieces FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = puzzle_pieces.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create puzzle pieces for own projects"
    ON puzzle_pieces FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = puzzle_pieces.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update puzzle pieces of own projects"
    ON puzzle_pieces FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = puzzle_pieces.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete puzzle pieces of own projects"
    ON puzzle_pieces FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = puzzle_pieces.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Conversations: Access through project ownership
CREATE POLICY "Users can view conversations of own projects"
    ON conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = conversations.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations for own projects"
    ON conversations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = conversations.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update conversations of own projects"
    ON conversations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = conversations.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete conversations of own projects"
    ON conversations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = conversations.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Messages: Access through conversation -> project ownership
CREATE POLICY "Users can view messages of own conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            JOIN projects ON projects.id = conversations.project_id
            WHERE conversations.id = messages.conversation_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            JOIN projects ON projects.id = conversations.project_id
            WHERE conversations.id = messages.conversation_id
            AND projects.user_id = auth.uid()
        )
    );

-- Messages are typically not updated or deleted, but adding policies for completeness
CREATE POLICY "Users can delete messages from own conversations"
    ON messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            JOIN projects ON projects.id = conversations.project_id
            WHERE conversations.id = messages.conversation_id
            AND projects.user_id = auth.uid()
        )
    );

-- Function to initialize puzzle pieces when a project is created
CREATE OR REPLACE FUNCTION initialize_puzzle_pieces()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert all 5 puzzle pieces for the new project
    INSERT INTO puzzle_pieces (project_id, piece_type, status)
    VALUES
        (NEW.id, 'purpose', 'available'),
        (NEW.id, 'customers', 'locked'),
        (NEW.id, 'boundaries', 'locked'),
        (NEW.id, 'features', 'locked'),
        (NEW.id, 'mvp', 'locked');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION initialize_puzzle_pieces();
