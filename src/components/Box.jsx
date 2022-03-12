import "/src/styles.css";

export default function Box({ className, mark, onClick }) {
  return (
    <div className={className} onClick={onClick}>
      {mark}
    </div>
  );
}
