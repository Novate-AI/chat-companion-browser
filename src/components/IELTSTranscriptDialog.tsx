import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadTranscriptPdf } from "@/lib/pdfExport";

interface IELTSTranscriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: { role: "user" | "assistant"; content: string }[];
}

export function IELTSTranscriptDialog({ open, onOpenChange, messages }: IELTSTranscriptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground">IELTS Speaking Transcript</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => downloadTranscriptPdf(messages, "IELTS Speaking")}
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
                <span className={msg.role === "user" ? "font-semibold text-primary" : "font-semibold text-rose-600"}>
                  {msg.role === "user" ? "Candidate" : "Examiner"}:
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
