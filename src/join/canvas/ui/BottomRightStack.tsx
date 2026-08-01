import { Panel } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { uiVisibilityAtom } from "../../state";
import { Minimap } from "../minimap/Minimap";
import { HideUiDot } from "./HideUiDot";
import "./BottomRightStack.css";

// Everything that anchors to the canvas' bottom-right corner shares one Panel —
// sibling Panels at the same position would stack on top of each other.
// Guests have no settings file, so the minimap is simply always on here.
export function BottomRightStack() {
  const uiVisible = useAtomValue(uiVisibilityAtom);

  return (
    <Panel position='bottom-right'>
      <div className='bottom-right-stack'>
        {!uiVisible && <HideUiDot />}
        {uiVisible && <Minimap />}
      </div>
    </Panel>
  );
}
