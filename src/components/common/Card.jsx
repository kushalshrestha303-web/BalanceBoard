function Card({ children, className = "" }) {
  return (
    <article className={`dashboard-card ${className}`}>
      {children}
    </article>
  );
}

export default Card;