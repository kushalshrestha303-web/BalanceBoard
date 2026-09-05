function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <h3>Something went wrong</h3>

      <p>{message}</p>

      {onRetry && (
        <button
          type="button"
          className="button button-primary"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;