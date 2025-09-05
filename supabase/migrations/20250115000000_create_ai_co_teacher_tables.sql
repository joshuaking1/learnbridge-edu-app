-- Create tables for AI Co-Teacher system
-- This migration creates all necessary tables for storing teacher assessment data and AI insights

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for storing student assessment data
CREATE TABLE IF NOT EXISTS assessment_analyses (
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
CREATE TABLE IF NOT EXISTS ai_insights (
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
CREATE TABLE IF NOT EXISTS teacher_stats (
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
CREATE TABLE IF NOT EXISTS assessment_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES assessment_analyses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendations JSONB NOT NULL DEFAULT '{}',
    next_steps TEXT[] DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing curriculum documents (SBC)
CREATE TABLE IF NOT EXISTS sbc_curriculum_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    content TEXT NOT NULL,
    topics TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing teacher search history (multi-modal search)
CREATE TABLE IF NOT EXISTS teacher_search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    search_type VARCHAR(50) NOT NULL CHECK (search_type IN ('youtube', 'google', 'image', 'curriculum')),
    results JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessment_analyses_teacher_id ON assessment_analyses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessment_analyses_created_at ON assessment_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_analyses_subject ON assessment_analyses(subject);
CREATE INDEX IF NOT EXISTS idx_assessment_analyses_percentage ON assessment_analyses(percentage);

CREATE INDEX IF NOT EXISTS idx_ai_insights_teacher_id ON ai_insights(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_priority ON ai_insights(priority);
CREATE INDEX IF NOT EXISTS idx_ai_insights_category ON ai_insights(category);
CREATE INDEX IF NOT EXISTS idx_ai_insights_is_read ON ai_insights(is_read);

CREATE INDEX IF NOT EXISTS idx_teacher_stats_teacher_id ON teacher_stats(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_stats_date ON teacher_stats(date DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_recommendations_assessment_id ON assessment_recommendations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_recommendations_teacher_id ON assessment_recommendations(teacher_id);

CREATE INDEX IF NOT EXISTS idx_sbc_curriculum_subject ON sbc_curriculum_documents(subject);
CREATE INDEX IF NOT EXISTS idx_sbc_curriculum_grade_level ON sbc_curriculum_documents(grade_level);
CREATE INDEX IF NOT EXISTS idx_sbc_curriculum_topics ON sbc_curriculum_documents USING GIN(topics);

CREATE INDEX IF NOT EXISTS idx_search_history_teacher_id ON teacher_search_history(teacher_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON teacher_search_history(created_at DESC);

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

-- SBC curriculum documents are public read-only
ALTER TABLE sbc_curriculum_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view curriculum documents" ON sbc_curriculum_documents
    FOR SELECT USING (true);

-- Create functions for common operations

-- Function to get teacher's recent assessments
CREATE OR REPLACE FUNCTION get_teacher_recent_assessments(
    p_teacher_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    student_name VARCHAR(255),
    subject VARCHAR(100),
    score INTEGER,
    total_questions INTEGER,
    percentage DECIMAL(5,2),
    topics TEXT[],
    strengths TEXT[],
    weaknesses TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.id,
        aa.student_name,
        aa.subject,
        aa.score,
        aa.total_questions,
        aa.percentage,
        aa.topics,
        aa.strengths,
        aa.weaknesses,
        aa.created_at
    FROM assessment_analyses aa
    WHERE aa.teacher_id = p_teacher_id
    ORDER BY aa.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get teacher's insights
CREATE OR REPLACE FUNCTION get_teacher_insights(
    p_teacher_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    insight_type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    action TEXT,
    priority VARCHAR(20),
    category VARCHAR(50),
    confidence DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ai.id,
        ai.insight_type,
        ai.title,
        ai.description,
        ai.action,
        ai.priority,
        ai.category,
        ai.confidence,
        ai.created_at
    FROM ai_insights ai
    WHERE ai.teacher_id = p_teacher_id
    ORDER BY 
        CASE ai.priority 
            WHEN 'high' THEN 3
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 1
        END DESC,
        ai.confidence DESC,
        ai.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update teacher stats
CREATE OR REPLACE FUNCTION update_teacher_stats(
    p_teacher_id UUID,
    p_active_students INTEGER DEFAULT NULL,
    p_avg_performance DECIMAL DEFAULT NULL,
    p_assessments_today INTEGER DEFAULT NULL,
    p_ai_suggestions INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO teacher_stats (
        teacher_id,
        active_students,
        avg_performance,
        assessments_today,
        ai_suggestions,
        total_assessments
    ) VALUES (
        p_teacher_id,
        COALESCE(p_active_students, 0),
        COALESCE(p_avg_performance, 0),
        COALESCE(p_assessments_today, 0),
        COALESCE(p_ai_suggestions, 0),
        1
    )
    ON CONFLICT (teacher_id, date) 
    DO UPDATE SET
        active_students = GREATEST(teacher_stats.active_students, COALESCE(p_active_students, teacher_stats.active_students)),
        avg_performance = CASE 
            WHEN p_avg_performance IS NOT NULL THEN p_avg_performance
            ELSE teacher_stats.avg_performance
        END,
        assessments_today = teacher_stats.assessments_today + COALESCE(p_assessments_today, 0),
        ai_suggestions = teacher_stats.ai_suggestions + COALESCE(p_ai_suggestions, 0),
        total_assessments = teacher_stats.total_assessments + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample curriculum data
INSERT INTO sbc_curriculum_documents (title, subject, grade_level, content, topics, learning_objectives) VALUES
('Basic Mathematics - Grade 1', 'Mathematics', 'Grade 1', 'Introduction to numbers, counting, and basic arithmetic operations. Students learn to count from 1-100, recognize number patterns, and perform simple addition and subtraction.', 
 ARRAY['Numbers', 'Counting', 'Addition', 'Subtraction'], 
 ARRAY['Count numbers 1-100', 'Perform basic addition', 'Perform basic subtraction', 'Recognize number patterns']),

('English Language - Grade 2', 'English', 'Grade 2', 'Reading comprehension, vocabulary building, and basic grammar. Students develop reading skills, learn new words, and understand sentence structure.', 
 ARRAY['Reading', 'Vocabulary', 'Grammar', 'Comprehension'], 
 ARRAY['Read simple sentences', 'Build vocabulary', 'Understand basic grammar', 'Answer comprehension questions']),

('Science - Grade 3', 'Science', 'Grade 3', 'Introduction to plants, animals, and the environment. Students learn about living things, their habitats, and basic environmental concepts.', 
 ARRAY['Plants', 'Animals', 'Environment', 'Habitats'], 
 ARRAY['Identify different plants', 'Classify animals', 'Understand habitats', 'Learn environmental concepts']),

('Social Studies - Grade 4', 'Social Studies', 'Grade 4', 'Ghanaian history, culture, and geography. Students learn about their country, traditions, and geographical features.', 
 ARRAY['History', 'Culture', 'Geography', 'Traditions'], 
 ARRAY['Learn Ghanaian history', 'Understand cultural traditions', 'Identify geographical features', 'Appreciate national heritage']),

('Mathematics - Grade 5', 'Mathematics', 'Grade 5', 'Advanced arithmetic, fractions, decimals, and basic geometry. Students work with larger numbers, fractions, and geometric shapes.', 
 ARRAY['Advanced Arithmetic', 'Fractions', 'Decimals', 'Geometry'], 
 ARRAY['Work with large numbers', 'Understand fractions', 'Use decimals', 'Identify geometric shapes']);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
