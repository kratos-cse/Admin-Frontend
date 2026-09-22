"use client";

import styles from "./PageHeader.module.css";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className={styles.desc}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
