export const getFilenameFromPath = (path:string) => {
  const mdFile = path.endsWith(".md");
  const filename = path.substring(path.lastIndexOf("/")+1);
  return mdFile ? filename.slice(0,-3) : filename;
}