import type { Metadata } from "next";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "AI Agents" };

export default function AiAgentsPage() {
  return (
    <>
      <h1 className={styles.title}>AI Agents</h1>
      <p className={styles.lede}>
        Drop an agent on the canvas, describe what you want, and watch it query, chart, and explain
        your data — with your own model, on your own machine.
      </p>
      <div className={styles.placeholder}>Design this section next — agents demo</div>
    </>
  );
}
