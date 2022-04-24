import { normalizePath } from "obsidian";

export const getFilenameFromPath = (path:string) => {
  const mdFile = path.endsWith(".md");
  const filename = path.substring(path.lastIndexOf("/")+1);
  return mdFile ? filename.slice(0,-3) : filename;
}

const getExtension = (path:string) => {
  const lastDot = path.lastIndexOf(".");
  if(lastDot === -1) return "md";
  return path.slice(lastDot+1);
}

export function splitFolderAndFilename(filepath: string): {
  folderpath: string;
  filename: string;
  basename: string;
} {
  const lastIndex = filepath.lastIndexOf("/");
  const filename = lastIndex == -1 ? filepath : filepath.substring(lastIndex + 1);
  return {
    folderpath: normalizePath(filepath.substring(0, lastIndex)),
    filename,
    basename: filename.replace(/\.[^/.]+$/, ""),
  };
}