/**
 * ConfirmDialog component
 * Reusable confirmation dialog for delete actions and other confirmations
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message/question
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} variant - Button variant: "danger" (red) or "default" (default: "danger")
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Function} onCancel - Callback when user cancels
 */
function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const buttonClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-indigo-600 hover:bg-indigo-700 text-white";

  // Split message by newlines to handle multi-line messages
  const messageLines = message.split("\n").filter((line) => line.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <div className="text-sm text-slate-600 mb-6">
          {messageLines.map((line, index) => (
            <p key={index} className={index > 0 ? "mt-2" : ""}>
              {line}
            </p>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${buttonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

