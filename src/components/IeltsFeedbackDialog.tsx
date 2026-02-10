import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { downloadFeedbackPdf } from "@/lib/pdfExport";

type Msg = { role: "user" | "assistant"; content: string };

const FEEDBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ielts-feedback`;

interface IeltsFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Msg[];
}

export function IeltsFeedbackDialog({ open, onOpenChange, messages }: IeltsFeedbackDialogProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages }),
      });
      if (!resp.ok) throw new Error("Failed to generate IELTS feedback");
      const data = await resp.json();
      setFeedback(data.feedback);
    } catch {
      setError("Could not generate IELTS feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (open && !feedback && !loading && !error) {
    generateFeedback();
  }

  const handleClose = (val: boolean) => {
    if (!val) {
      setFeedback(null);
      setError(null);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground">IELTS Speaking Report</DialogTitle>
            {feedback && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => downloadFeedbackPdf(feedback, messages, "IELTS Speaking")}
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
            <p className="text-sm text-muted-foreground">Generating your IELTS band score report...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={generateFeedback}>
              Try Again
            </Button>
          </div>
        )}

        {feedback && (
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
              {feedback}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
