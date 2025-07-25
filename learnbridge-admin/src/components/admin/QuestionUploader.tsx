// learnbridge-admin/src/components/admin/QuestionUploader.tsx
"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { bulkUploadQuestions } from "@/app/dashboard/questions/actions";

export const QuestionUploader = () => {
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleFileParse = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const validationErrors: string[] = [];
                results.data.forEach((row: any, index: number) => {
                    if (!row.question_text || !row.exam_type || !row.subject) {
                        validationErrors.push(`Row ${index + 2}: Missing required fields (question_text, exam_type, subject).`);
                    }
                    if (row.question_type === 'mcq' && (!row.options || !row.correct_answer)) {
                        validationErrors.push(`Row ${index + 2}: MCQ questions must have 'options' and 'correct_answer' columns.`);
                    }
                });

                if (validationErrors.length > 0) {
                    setErrors(validationErrors);
                    setParsedData([]);
                } else {
                    // Transform the 'options' string into a JSON array
                    const transformedData = results.data.map((row: any) => ({
                        ...row,
                        options: row.options ? JSON.parse(row.options) : null
                    }));
                    setParsedData(transformedData);
                    setErrors([]);
                }
            }
        });
    };

    const handleUpload = async () => {
        if (parsedData.length === 0) return;
        setIsLoading(true);
        setSuccessMessage(null);
        setErrors([]);

        const result = await bulkUploadQuestions(parsedData);

        if (result.error) {
            setErrors([result.error]);
        } else {
            setSuccessMessage(`${result.count} questions were successfully uploaded!`);
            setParsedData([]); // Clear the preview table
        }
        setIsLoading(false);
    };
    
    return (
        <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
                <CardTitle>Bulk Upload Question Bank</CardTitle>
                <CardDescription>Upload a CSV file with your questions. Required columns: exam_type, subject, topic, question_text, question_type, options, correct_answer, difficulty_level, source_year. For MCQs, the 'options' column must be a valid JSON array string (e.g., '["A", "B", "C"]').</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input type="file" accept=".csv" onChange={handleFileParse} className="bg-slate-800 border-slate-600 file:text-slate-300"/>
                
                {errors.length > 0 && (
                    <div className="p-4 bg-red-900/50 border border-red-500 rounded-md">
                        <h4 className="font-bold text-red-400 flex items-center"><AlertCircle className="mr-2"/>Validation Errors</h4>
                        <ul className="list-disc pl-5 text-sm text-red-300">
                            {errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}
                
                {successMessage && (
                    <div className="p-4 bg-green-900/50 border border-green-500 rounded-md text-green-300">
                       <h4 className="font-bold flex items-center"><CheckCircle className="mr-2"/>{successMessage}</h4>
                    </div>
                )}

                {parsedData.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2">Preview Data ({parsedData.length} questions found)</h4>
                        <div className="h-64 overflow-y-auto rounded-md border border-slate-700">
                            <Table>
                                <TableHeader><TableRow><TableHead>Question</TableHead><TableHead>Subject</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {parsedData.slice(0, 10).map((row, i) => <TableRow key={i}><TableCell>{row.question_text}</TableCell><TableCell>{row.subject}</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </div>
                        <Button onClick={handleUpload} disabled={isLoading} className="w-full mt-4">
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Uploading...</> : <><Upload className="mr-2 h-4 w-4"/> Confirm and Upload {parsedData.length} Questions</>}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
