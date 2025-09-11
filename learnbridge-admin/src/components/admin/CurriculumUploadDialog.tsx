// learnbridge-admin/src/components/admin/CurriculumUploadDialog.tsx
"use client";

import { useState, useEffect, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2, AlertCircle } from "lucide-react"; // Added AlertCircle
import { ingestSBCDocument } from "@/app/dashboard/curriculum/actions";
import { ErrorDisplay } from "@/components/ui/error-display";

// The initial state for the form action
const initialState = {
    success: false,
    error: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-orange-600 hover:bg-orange-700"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Ingesting...
        </>
      ) : (
        "Ingest Document"
      )}
    </Button>
  );
}

export function CurriculumUploadDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(ingestSBCDocument, initialState);

  useEffect(() => {
    if (state.success && open) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <PlusCircle className="mr-2 h-4 w-4" /> Ingest New Document
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Ingest New SBC Document</DialogTitle>
          <DialogDescription>
            Upload a PDF. The system will automatically parse it, chunk it, and
            generate embeddings.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                required
                className="bg-slate-800 border-slate-600"
              />
            </div>
            <div>
              <Label htmlFor="grade">Grade / Form</Label>
              <Input
                id="grade"
                name="grade"
                required
                className="bg-slate-800 border-slate-600"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="file">SBC PDF Document</Label>
            <Input
              id="file"
              name="file"
              type="file"
              required
              accept="application/pdf"
              className="bg-slate-800 border-slate-600 file:text-slate-300"
            />
          </div>
          
          {state.error && (
            <ErrorDisplay 
              error={state.error} 
              title="Document Ingestion Failed"
              className="text-sm"
            />
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}