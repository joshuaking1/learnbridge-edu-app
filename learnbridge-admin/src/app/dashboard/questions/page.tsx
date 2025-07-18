// learnbridge-admin/src/app/dashboard/questions/page.tsx
import { QuestionUploader } from "@/components/admin/QuestionUploader";

export default function QuestionsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Question Bank Management</h1>
                <p className="text-slate-400 mt-2">
                    Upload and manage questions for mock exams and assessments.
                </p>
            </div>
            
            <QuestionUploader />
        </div>
    );
}
