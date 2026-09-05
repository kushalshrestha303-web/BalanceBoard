function EmptyState({
  icon = "📋",
  title = "Nothing here yet",
  description,
  children,
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>

      <h3>{title}</h3>

      {description && <p>{description}</p>}

      {children}
    </div>
  );
}

export default EmptyState;