import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface Props {
  scheduleName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteDialog({ scheduleName, onConfirm, onCancel }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const handleEscape = useCallback(() => onCancel(), [onCancel]);
  useEscapeKey(handleEscape);
  useFocusTrap(modalRef, true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center rotation-no-print"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="theme-border theme-shadow p-6 max-w-sm w-full mx-4"
        style={{ backgroundColor: "var(--dt-card-bg)", borderRadius: "16px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="size-5" style={{ color: "#DC2626" }} aria-hidden="true" />
          <h3 id="delete-dialog-title" className="font-extrabold text-lg">当番表を削除</h3>
        </div>
        <p className="text-sm mb-6" style={{ color: "#555" }}>
          「{scheduleName}」を削除しますか？この操作は元に戻せません。
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="theme-border theme-shadow-sm flex-1 px-4 py-2.5 font-bold text-sm transition-all duration-150 theme-hover-lift"
            style={{ backgroundColor: "var(--dt-card-bg)", borderRadius: "10px" }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="theme-border theme-shadow-sm flex-1 px-4 py-2.5 font-bold text-sm text-white transition-all duration-150 theme-hover-lift"
            style={{ backgroundColor: "#DC2626", borderRadius: "10px" }}
          >
            削除する
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
