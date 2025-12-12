/**
 * Alert component styling map
 * Maps alert types to Tailwind CSS classes
 */
const typeClasses = {
    error: "bg-red-100 text-red-700",
    success: "bg-emerald-100 text-emerald-700",
    info: "bg-slate-100 text-slate-700",
  };
  
  /**
   * Alert component
   * Displays styled alert messages (error, success, info)
   * @param {string} [type="info"] - Alert type: "error", "success", or "info"
   * @param {ReactNode} children - Alert message content
   */
  function Alert({ type = "info", children }) {
    // Get classes for the alert type, default to info if type is invalid
    const classes = typeClasses[type] || typeClasses.info;
  
    return (
      <div className={`mb-4 rounded-md px-3 py-2 text-sm ${classes}`}>
        {children}
      </div>
    );
  }
  
  export default Alert;
  