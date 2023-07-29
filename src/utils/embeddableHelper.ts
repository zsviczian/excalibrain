const RE_YOUTUBE =
  /^(?:http(?:s)?:\/\/)?(?:www\.)?youtu(?:be\.com|\.be)\/(embed\/|watch\?v=|shorts\/|playlist\?list=|embed\/videoseries\?list=)?([a-zA-Z0-9_-]+)(?:\?t=|&t=|\?start=|&start=)?([a-zA-Z0-9_-]+)?[^\s]*$/;
const RE_VIMEO =
  /^(?:http(?:s)?:\/\/)?(?:(?:w){3}.)?(?:player\.)?vimeo\.com\/(?:video\/)?([^?\s]+)(?:\?.*)?$/;

const getAspectRatio = (link: string): number | null => {
  if (!link) {
    return null;
  }

  const ytLink = link.match(RE_YOUTUBE);
  if (ytLink?.[2]) {
    const isPortrait = link.includes("shorts");
    return isPortrait ? 315/560 : 560/315;
  }

  const vimeoLink = link.match(RE_VIMEO);
  if (vimeoLink?.[1]) {
    return 560/315;
  }

  return null;
}

export const getEmbeddableDimensions = (link: string, maxDimensions: { width: number, height: number }): { width: number, height: number } => {
  const aspectRatio = getAspectRatio(link);
  if (!aspectRatio) {
    return maxDimensions;
  }
  if (aspectRatio > 1) {
    return {
      width: maxDimensions.width,
      height: maxDimensions.width / aspectRatio,
    }
  }
  return {
    width: maxDimensions.height * aspectRatio,
    height: maxDimensions.height,
  }
}