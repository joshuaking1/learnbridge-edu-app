# PostHog Analytics Integration Guide

## Setup Instructions

### 1. Get PostHog Project Key
1. Go to [PostHog](https://app.posthog.com)
2. Create a new project or use existing one
3. Go to Project Settings → API Keys
4. Copy your Project API Key

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# Frontend and Admin Apps
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Supabase Edge Functions
POSTHOG_KEY=your_posthog_project_key_here
```

### 3. PostHog Dashboard Setup

#### Key Events to Monitor:
- **Authentication**: `sign_up_attempted`, `sign_up_successful`, `sign_in_attempted`, `sign_in_successful`
- **Student Learning**: `student_learning_requested`, `student_learning_generated`, `student_quiz_requested`, `student_quiz_generated`
- **Teacher Tools**: `teacher_chat_requested`, `teacher_chat_successful`, `teacher_search_attempted`, `teacher_search_successful`
- **Navigation**: `student_navigation_clicked`, `teacher_navigation_clicked`
- **System**: `system_page_load_time`, `system_api_response_time`, `system_error_occurred`

#### Custom Properties:
- `user_role`: 'student' or 'teacher'
- `subject`: Subject being studied/taught
- `topic`: Specific topic or lesson
- `timestamp`: ISO timestamp for all events

### 4. Analytics Features Enabled

#### Real-time Analytics:
- User authentication flows
- Learning progress tracking
- Teacher tool usage
- Navigation patterns
- Performance metrics
- Error tracking

#### User Identification:
- Students identified with grade, subjects, school
- Teachers identified with subjects, grades, experience
- Activity tracking and engagement metrics

#### Event Tracking:
- Comprehensive event tracking across all components
- API endpoint performance monitoring
- Supabase Edge Function analytics
- Dashboard interaction tracking

### 5. Privacy Considerations

- No personally identifiable information (PII) is tracked
- Email domains are anonymized (only domain part is tracked)
- User IDs are hashed/anonymized
- All tracking respects user privacy preferences

### 6. Monitoring Dashboard

Create PostHog dashboards for:
- User engagement metrics
- Feature adoption rates
- Performance monitoring
- Error tracking
- Learning progress analytics
- Teacher tool usage patterns

### 7. Alerts Setup

Set up alerts for:
- High error rates
- Performance degradation
- Unusual usage patterns
- System failures
