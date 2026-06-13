import { SubpageNav } from "@/components/SubpageNav/SubpageNav";
import { navTree } from "../navTree";

export function DocsNav() {
  return <SubpageNav tree={navTree} root='/docs' ariaLabel='Documentation' />;
}
