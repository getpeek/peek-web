import { keybindingCategories } from "./keybindingCategories";
import { keyIcons } from "./keyIcons";
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
                <span className={styles.keys}>
                  {keys.map(key => {
                    const icon = keyIcons[key];
                    return icon ? (
                      <kbd key={key} aria-label={icon.label}>
                        {icon.icon}
                      </kbd>
                    ) : (
                      <kbd key={key}>{key}</kbd>
                    );
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
