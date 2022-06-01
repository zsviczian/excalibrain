import { App, normalizePath, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { errorlog } from "./utils";

export const getFilenameFromPath = (path:string):string => {
  const mdFile = path.endsWith(".md");
  const filename = path.substring(path.lastIndexOf("/")+1);
  return mdFile ? filename.slice(0,-3) : filename;
}

const getExtension = (path:string):string => {
  if(!path) {
    return;
  }
  const extension = path.match(/\.([^/]*)$/);
  if(!extension) return "md";
  return extension[1];
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

export function resolveTFolder(app: App, folder_str: string): TFolder {
  folder_str = normalizePath(folder_str);

  const folder = app.vault.getAbstractFileByPath(folder_str);
  if (!folder) {
    errorlog({fn: resolveTFolder,message: `Folder "${folder_str}" doesn't exist`,where:"resolveTFolder"});
    return null;
  }
  if (!(folder instanceof TFolder)) {
    errorlog({fn: resolveTFolder,message: `${folder_str} is a file, not a folder`,where:"resolveTFolder"});
    return null;
  }
  return folder;
}

export function getTFilesFromFolder(
  app: App,
  folder_str: string
): Array<TFile> {
  const folder = resolveTFolder(app, folder_str);

  const files: Array<TFile> = [];
  Vault.recurseChildren(folder, (file: TAbstractFile) => {
      if (file instanceof TFile) {
          files.push(file);
      }
  });

  files.sort((a, b) => {
      return a.basename.localeCompare(b.basename);
  });

  return files;
}