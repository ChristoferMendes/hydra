import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import * as styles from "./tooltip.css";

interface Props {
  children: React.ReactElement<unknown>;
  content: string;
  delay?: number;
}

export function Tooltip({ children, content, delay = 300 }: Readonly<Props>) {
  return (
    <Tippy
      content={content}
      placement="top"
      delay={delay}
      className={styles.tooltip}
    >
      {children}
    </Tippy>
  );
}
