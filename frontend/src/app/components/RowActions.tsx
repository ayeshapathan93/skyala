import { Link } from "react-router";
import { Eye, Pencil, Trash2 } from "lucide-react";

type RowActionsProps = {
  viewTo: string;
  onEdit: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
};

export default function RowActions({ viewTo, onEdit, onDelete, deleteLabel = "Delete" }: RowActionsProps) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      <Link
        to={viewTo}
        title="View details"
        className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
      >
        <Eye className="w-4 h-4" />
      </Link>
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-amber-700 hover:bg-amber-500/15 transition-colors"
      >
        <Pencil className="w-4 h-4" />
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title={deleteLabel}
          aria-label={deleteLabel}
          className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
