import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Trash2Icon } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "./ui/button";

interface ConfirmActionDialogProps {
  /** Button element (icon or text) */
  trigger?: ReactNode;

  /** Dialog title */
  title: string;

  /** Dialog description */
  description: string;

  /** Confirm button text */
  confirmText?: string;

  /** Confirm button variant */
  confirmVariant?: "default" | "destructive";

  /** Callback on confirm */
  onConfirm: () => void;

  /** Disable confirm */
  disabled?: boolean;

  /** Stop row click propagation */
  stopPropagation?: boolean;
}

export function ConfirmActionDialog({
  trigger,
  title,
  description,
  confirmText = "Confirm",
  confirmVariant = "destructive",
  onConfirm,
  disabled = false,
  stopPropagation = true,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <span
          onClick={(e) => stopPropagation && e.stopPropagation()}
          className="inline-flex"
        >
          {trigger || (
            <Button
              variant="outline"
              size="icon"
              className="
                h-8 w-8
                border-red-200
                text-red-600
                hover:bg-red-50
                hover:text-red-700
              "
            >
              <Trash2Icon className="w-4 h-4" />
            </Button>
          )}
        </span>
      </AlertDialogTrigger>

      <AlertDialogContent
        onClick={(e: any) => stopPropagation && e.stopPropagation()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={disabled}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={disabled}
            className={
              confirmVariant === "destructive"
                ? "bg-red-600 hover:bg-red-700"
                : ""
            }
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
