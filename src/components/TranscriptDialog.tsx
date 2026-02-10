import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadTranscriptPdf } from "@/lib/pdfExport";

interface TranscriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: { role: "user" | "assistant"; content: string }[];
  language: string;
}

export function TranscriptDialog({ open, onOpenChange, messages, language }: TranscriptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground">{language} Lesson Transcript</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => downloadTranscriptPdf(messages, language)}
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className={msg.role === "user" ? "font-semibold text-primary" : "font-semibold text-teal-600"}>
                  {msg.role === "user" ? "You" : "Tom Holland"}:
                </span>
                <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
