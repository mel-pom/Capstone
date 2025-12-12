/**
 * Loader component
 * Displays a loading spinner with optional text
 * @param {string} [text="Loading..."] - Text to display next to spinner
 */
function Loader({ text = "Loading..." }) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {/* Animated spinning circle */}
        <span className="inline-block h-3 w-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span>{text}</span>
      </div>
    );
  }
  
  export default Loader;
  