import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

const EDITOR_CODE = ">^a!7JyzBZp_Gs-yN.?4Uos7o!XMXHRNcbmu_ys@RNZaTapnNa";

interface EditorModeVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}

export const EditorModeVerification = ({ open, onOpenChange, onVerified }: EditorModeVerificationProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const handleVerify = () => {
    if (code === EDITOR_CODE) {
      onVerified();
      setCode("");
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Editor Mode Verification
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Enter Editor Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              placeholder="Enter code"
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-sm text-destructive">Invalid code. Please try again.</p>
            )}
          </div>
          <Button onClick={handleVerify} className="w-full">
            Verify
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
