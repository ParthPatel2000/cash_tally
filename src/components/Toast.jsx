export function Toast({ toast }) {
  return <div className={`toast${toast.message ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>{toast.message}</div>;
}
