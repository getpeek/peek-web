import { Kbd } from "../Kbd/Kbd";
import { keybindingCategories } from "./keybindingCategories";
import styles from "./Keybindings.module.css";

export function Keybindings() {
  return (
    <>
      {keybindingCategories.map(({ category, rows }) => (
        <div key={category} className={styles.category}>
          <div className={styles.label}>{category}</div>
          <div className={styles.list}>
            {rows.map(({ action, keys }) => (
              <div key={action} className={styles.row}>
                <span className={styles.action}>{action}</span>
                <Kbd>{keys.join(" + ")}</Kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
