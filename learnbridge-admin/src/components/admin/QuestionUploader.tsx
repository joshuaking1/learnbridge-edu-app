// learnbridge-admin/src/components/admin/QuestionUploader.tsx
"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { bulkUploadQuestions } from "@/app/dashboard/questions/actions";
import { ErrorDisplay } from "@/components/ui/error-display";

export const QuestionUploader = () => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [detailedError, setDetailedError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileParse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("🚀 Starting CSV file parsing:", { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });

    setParsedData([]);
    setErrors([]);
    setDetailedError(null);
    setSuccessMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("📄 CSV parsing completed:", {
          rowCount: results.data?.length || 0,
          hasErrors: results.errors?.length > 0,
          meta: results.meta
        });

        if (results.errors?.length > 0) {
          console.error("❌ CSV parsing errors:", results.errors);
          setDetailedError({
            message: "CSV file parsing failed",
            code: "CSV_PARSE_ERROR",
            details: {
              parseErrors: results.errors,
              fileName: file.name,
              fileSize: file.size
            },
            context: {
              rowsParsed: results.data?.length || 0,
              parseMethod: "Papa Parse"
            },
            timestamp: new Date().toISOString()
          });
          return;
        }

        const validationErrors: string[] = [];

        // --- 100x DATA TRANSFORMATION & VALIDATION LOGIC ---
        const transformedData = results.data
          .map((row: any, index: number) => {
            // Basic validation
            if (!row.question_text || !row.exam_type || !row.subject) {
              validationErrors.push(
                `Row ${
                  index + 2
                }: Missing required fields (question_text, exam_type, subject).`
              );
              return null;
            }
            if (
              row.question_type === "mcq" &&
              (!row.options || !row.correct_answer)
            ) {
              validationErrors.push(
                `Row ${
                  index + 2
                }: MCQ questions must have 'options' and 'correct_answer' columns.`
              );
              return null;
            }

            // Intelligent Difficulty Level Transformation
            let difficulty: number;
            const difficultyStr = (row.difficulty_level || "").toLowerCase();
            switch (difficultyStr) {
              case "easy":
                difficulty = 1;
                break;
              case "medium":
                difficulty = 3;
                break;
              case "hard":
                difficulty = 5;
                break;
              default:
                difficulty = parseInt(difficultyStr, 10);
            }

            if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
              validationErrors.push(
                `Row ${
                  index + 2
                }: Invalid 'difficulty_level'. Use "Easy", "Medium", "Hard", or a number 1-5.`
              );
              return null;
            }

            // JSON Options Transformation
            let optionsJson = null;
            if (row.options) {
              try {
                optionsJson = JSON.parse(row.options);
                if (!Array.isArray(optionsJson)) throw new Error();
              } catch (err) {
                validationErrors.push(
                  `Row ${
                    index + 2
                  }: The 'options' column contains invalid JSON. It must be an array string, e.g., '["A", "B"]'.`
                );
                return null;
              }
            }

            return {
              ...row,
              difficulty_level: difficulty,
              options: optionsJson,
              source_year:
                parseInt(row.source_year, 10) || new Date().getFullYear(),
            };
          })
          .filter(Boolean); // Filter out any null rows that failed validation

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setParsedData([]);
        } else {
          setParsedData(transformedData);
          setErrors([]);
        }
      },
    });
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    
    console.log("🚀 Starting bulk question upload:", { questionsCount: parsedData.length });
    
    setIsLoading(true);
    setSuccessMessage(null);
    setErrors([]);
    setDetailedError(null);

    try {
      // The data sent to the action is now clean and perfectly typed.
      const result = await bulkUploadQuestions(parsedData);

      if (result.error) {
        console.error("❌ Bulk upload failed:", result);
        
        if (result.errorDetails) {
          setDetailedError(result.errorDetails);
        } else {
          setErrors([result.error]);
        }
      } else if (result.success) {
        console.log("✅ Bulk upload successful:", result);
        setSuccessMessage(
          `${result.count} questions were successfully uploaded!`
        );
        setParsedData([]);
      }
    } catch (error: any) {
      console.error("❌ Unexpected client-side error:", error);
      setDetailedError({
        message: "Client-side error during upload",
        code: "CLIENT_ERROR",
        details: {
          errorName: error.name,
          errorMessage: error.message,
          questionsCount: parsedData.length
        },
        stack: error.stack,
        context: {
          location: "QuestionUploader.handleUpload",
          questionsCount: parsedData.length
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle>Bulk Upload Question Bank</CardTitle>
        <CardDescription>
          Upload a CSV file with your questions. Required columns: exam_type,
          subject, topic, question_text, question_type, options, correct_answer,
          difficulty_level, source_year. For MCQs, the 'options' column must be
          a valid JSON array string (e.g, '["A", "B", "C"]').
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileParse}
          className="bg-slate-800 border-slate-600 file:text-slate-300"
        />

        {/* Detailed Error Display */}
        {detailedError && (
          <ErrorDisplay 
            error={detailedError} 
            title="Question Upload Error"
            className="text-sm"
          />
        )}

        {/* Simple Validation Errors */}
        {errors.length > 0 && !detailedError && (
          <div className="p-4 bg-red-900/50 border border-red-500 rounded-md">
            <h4 className="font-bold text-red-400 flex items-center">
              <AlertCircle className="mr-2" />
              Validation Errors
            </h4>
            <ul className="list-disc pl-5 text-sm text-red-300">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-900/50 border border-green-500 rounded-md text-green-300">
            <h4 className="font-bold flex items-center">
              <CheckCircle className="mr-2" />
              {successMessage}
            </h4>
          </div>
        )}

        {parsedData.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">
              Preview Data ({parsedData.length} questions found)
            </h4>
            <div className="h-64 overflow-y-auto rounded-md border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Subject</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.question_text}</TableCell>
                      <TableCell>{row.subject}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button
              onClick={handleUpload}
              disabled={isLoading}
              className="w-full mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Confirm and Upload{" "}
                  {parsedData.length} Questions
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
