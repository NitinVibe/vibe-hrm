import {
  Bot,
  BrainCircuit,
  Send,
  Sparkles,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function AIAssistant() {
  return (
    <div>
      <PageHeader
        title="AI Assistant"
        description="Ask questions about your organization's HR data and workflows."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Bot size={19} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Vibe HRM Assistant
              </h2>

              <p className="text-xs text-slate-400">
                HR intelligence assistant
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-[360px]">
          <EmptyState
            icon={Sparkles}
            title="How can I help?"
            description="Ask about authorized HR data, workforce trends, attendance, recruitment, payroll, performance or other HRM workflows."
          />
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex gap-2">
            <input
              disabled
              placeholder="Ask Vibe HRM AI..."
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none"
            />

            <Button disabled>
              <Send size={16} />
              Send
            </Button>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <BrainCircuit size={13} />
            AI responses will use authorized HRM data only.
          </div>
        </div>
      </Card>
    </div>
  );
}