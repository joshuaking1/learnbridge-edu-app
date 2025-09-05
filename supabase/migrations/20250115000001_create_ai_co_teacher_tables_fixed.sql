-- Create tables for AI Co-Teacher system (Fixed Version)
-- This migration creates all necessary tables for storing teacher assessment data and AI insights

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS teacher_search_history CASCADE;
DROP TABLE IF EXISTS assessment_recommendations CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS teacher_stats CASCADE;
DROP TABLE IF EXISTS sbc_curriculum_documents CASCADE;
DROP TABLE IF EXISTS assessment_analyses CASCADE;

-- Table for storing student assessment data
CREATE TABLE assessment_analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_questions > 0 THEN ROUND((score::DECIMAL / total_questions) * 100, 2)
            ELSE 0
        END
    ) STORED,
    topics TEXT[] DEFAULT '{}',
    strengths TEXT[] DEFAULT '{}',
    weaknesses TEXT[] DEFAULT '{}',
    analysis_data JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing AI-generated insights
CREATE TABLE ai_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessment_analyses(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('warning', 'success', 'info', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    category VARCHAR(50) CHECK (category IN ('performance', 'curriculum', 'engagement', 'resources', 'trends')),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    affected_students TEXT[] DEFAULT '{}',
    suggested_resources TEXT[] DEFAULT '{}',
    timeline VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing teacher statistics
CREATE TABLE teacher_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    active_students INTEGER DEFAULT 0,
    avg_performance DECIMAL(5,2) DEFAULT 0,
    assessments_today INTEGER DEFAULT 0,
    ai_suggestions INTEGER DEFAULT 0,
    total_assessments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, date)
);

-- Table for storing AI recommendations for specific assessments
CREATE TABLE assessment_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES assessment_analyses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendations JSONB NOT NULL DEFAULT '{}',
    next_steps TEXT[] DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing curriculum documents (SBC)
CREATE TABLE sbc_curriculum_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    raw_text TEXT NOT NULL,
    content TEXT NOT NULL,
    topics TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'embedding_complete', 'error')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing teacher search history (multi-modal search)
CREATE TABLE teacher_search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    search_type VARCHAR(50) NOT NULL CHECK (search_type IN ('youtube', 'google', 'image', 'curriculum')),
    results JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_assessment_analyses_teacher_id ON assessment_analyses(teacher_id);
CREATE INDEX idx_assessment_analyses_created_at ON assessment_analyses(created_at DESC);
CREATE INDEX idx_assessment_analyses_subject ON assessment_analyses(subject);
CREATE INDEX idx_assessment_analyses_percentage ON assessment_analyses(percentage);

CREATE INDEX idx_ai_insights_teacher_id ON ai_insights(teacher_id);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority);
CREATE INDEX idx_ai_insights_category ON ai_insights(category);
CREATE INDEX idx_ai_insights_is_read ON ai_insights(is_read);

CREATE INDEX idx_teacher_stats_teacher_id ON teacher_stats(teacher_id);
CREATE INDEX idx_teacher_stats_date ON teacher_stats(date DESC);

CREATE INDEX idx_assessment_recommendations_assessment_id ON assessment_recommendations(assessment_id);
CREATE INDEX idx_assessment_recommendations_teacher_id ON assessment_recommendations(teacher_id);

CREATE INDEX idx_sbc_curriculum_subject ON sbc_curriculum_documents(subject);
CREATE INDEX idx_sbc_curriculum_uploader_id ON sbc_curriculum_documents(uploader_id);
CREATE INDEX idx_sbc_curriculum_status ON sbc_curriculum_documents(status);
CREATE INDEX idx_sbc_curriculum_created_at ON sbc_curriculum_documents(created_at DESC);

CREATE INDEX idx_search_history_teacher_id ON teacher_search_history(teacher_id);
CREATE INDEX idx_search_history_created_at ON teacher_search_history(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_assessment_analyses_updated_at 
    BEFORE UPDATE ON assessment_analyses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_stats_updated_at 
    BEFORE UPDATE ON teacher_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sbc_curriculum_updated_at 
    BEFORE UPDATE ON sbc_curriculum_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE assessment_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_search_history ENABLE ROW LEVEL SECURITY;

-- Assessment analyses policies
CREATE POLICY "Teachers can view their own assessments" ON assessment_analyses
    FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own assessments" ON assessment_analyses
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own assessments" ON assessment_analyses
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own assessments" ON assessment_analyses
    FOR DELETE USING (auth.uid() = teacher_id);

-- AI insights policies
CREATE POLICY "Teachers can view their own insights" ON ai_insights
    FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own insights" ON ai_insights
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own insights" ON ai_insights
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own insights" ON ai_insights
    FOR DELETE USING (auth.uid() = teacher_id);

-- Teacher stats policies
CREATE POLICY "Teachers can view their own stats" ON teacher_stats
    FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own stats" ON teacher_stats
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own stats" ON teacher_stats
    FOR UPDATE USING (auth.uid() = teacher_id);

-- Assessment recommendations policies
CREATE POLICY "Teachers can view their own recommendations" ON assessment_recommendations
    FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own recommendations" ON assessment_recommendations
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Search history policies
CREATE POLICY "Teachers can view their own search history" ON teacher_search_history
    FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own search history" ON teacher_search_history
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- SBC curriculum documents policies
ALTER TABLE sbc_curriculum_documents ENABLE ROW LEVEL SECURITY;

-- Anyone can view curriculum documents (public read-only)
CREATE POLICY "Anyone can view curriculum documents" ON sbc_curriculum_documents
    FOR SELECT USING (true);

-- Only uploaders can insert/update/delete their own documents
CREATE POLICY "Users can insert their own curriculum documents" ON sbc_curriculum_documents
    FOR INSERT WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Users can update their own curriculum documents" ON sbc_curriculum_documents
    FOR UPDATE USING (auth.uid() = uploader_id);

CREATE POLICY "Users can delete their own curriculum documents" ON sbc_curriculum_documents
    FOR DELETE USING (auth.uid() = uploader_id);

-- Sample data will be inserted through the curriculum upload interface
-- This ensures proper user authentication and foreign key relationships

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
