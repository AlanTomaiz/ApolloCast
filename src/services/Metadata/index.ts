type MediaKind = 'series' | 'movie' | 'unknown';

interface ParsedFileName {
  title: string;
  season?: number;
  episode?: number;
  kind: MediaKind;
}

export interface ResolvedMediaMetadata {
  kind: MediaKind;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
}

const NOISE_TOKENS = [
  '2160p',
  '1080p',
  '720p',
  '480p',
  'web-dl',
  'webrip',
  'bluray',
  'brrip',
  'dvdrip',
  'ddp5 1',
  'ddp',
  'aac',
  'dts',
  'x264',
  'x265',
  'h 264',
  'h 265',
  'hevc',
  '10bit',
  'dual',
  'legendado',
  'dublado'
];

const toTitleCase = (value: string): string =>
  value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const sanitizeRawName = (fileName: string): string =>
  fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripNoise = (value: string): string => {
  let normalized = value;

  for (const token of NOISE_TOKENS) {
    const pattern = new RegExp(`\\b${token.replace(' ', '\\s*')}\\b`, 'ig');
    normalized = normalized.replace(pattern, ' ');
  }

  normalized = normalized.replace(/\s+-\s+[A-Za-z0-9]+$/g, ' ');

  return normalized.replace(/\s+/g, ' ').trim();
};

const parseFileName = (fileName: string): ParsedFileName => {
  const raw = sanitizeRawName(fileName);

  const seasonEpisodeMatch = raw.match(/\b[Ss](\d{1,2})[Ee](\d{1,2})\b/);
  if (seasonEpisodeMatch) {
    const season = Number(seasonEpisodeMatch[1]);
    const episode = Number(seasonEpisodeMatch[2]);
    const titleSlice = raw.slice(0, seasonEpisodeMatch.index || 0);
    const title = stripNoise(titleSlice) || stripNoise(raw) || raw;

    return {
      kind: 'series',
      title: toTitleCase(title),
      season,
      episode
    };
  }

  const xFormatMatch = raw.match(/\b(\d{1,2})x(\d{1,2})\b/i);
  if (xFormatMatch) {
    const season = Number(xFormatMatch[1]);
    const episode = Number(xFormatMatch[2]);
    const titleSlice = raw.slice(0, xFormatMatch.index || 0);
    const title = stripNoise(titleSlice) || stripNoise(raw) || raw;

    return {
      kind: 'series',
      title: toTitleCase(title),
      season,
      episode
    };
  }

  const movieTitle = stripNoise(raw) || raw;

  return {
    kind: 'movie',
    title: toTitleCase(movieTitle)
  };
};

const searchSeriesMetadata = async (
  title: string,
  season?: number,
  episode?: number
): Promise<ResolvedMediaMetadata | null> => {
  const response = await fetch(
    `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(title)}&embed=episodes`
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    name?: string;
    image?: { original?: string; medium?: string };
    _embedded?: {
      episodes?: Array<{ season: number; number: number; name?: string }>;
    };
  };

  const normalizedTitle = payload.name || title;
  const imageUrl = payload.image?.original || payload.image?.medium || null;

  let subtitle: string | null = null;
  if (season && episode) {
    const episodeName = payload._embedded?.episodes?.find(
      (item) => item.season === season && item.number === episode
    )?.name;

    subtitle = `Temporada ${season} - Episodio ${episode}`;
    if (episodeName) {
      subtitle = `${subtitle} - ${episodeName}`;
    }
  }

  return {
    kind: 'series',
    title: normalizedTitle,
    subtitle,
    imageUrl
  };
};

const searchMovieMetadata = async (
  title: string
): Promise<ResolvedMediaMetadata | null> => {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=movie&limit=1`
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    results?: Array<{ trackName?: string; artworkUrl100?: string }>;
  };

  const firstResult = payload.results?.[0];
  if (!firstResult) {
    return null;
  }

  const imageUrl =
    firstResult.artworkUrl100?.replace('100x100bb', '600x600bb') || null;

  return {
    kind: 'movie',
    title: firstResult.trackName || title,
    subtitle: null,
    imageUrl
  };
};

export const resolveMediaMetadata = async (
  fileName: string
): Promise<ResolvedMediaMetadata> => {
  const parsed = parseFileName(fileName);

  try {
    if (parsed.kind === 'series') {
      const foundSeries = await searchSeriesMetadata(
        parsed.title,
        parsed.season,
        parsed.episode
      );

      if (foundSeries) {
        return foundSeries;
      }
    }

    if (parsed.kind === 'movie' || parsed.kind === 'unknown') {
      const foundMovie = await searchMovieMetadata(parsed.title);

      if (foundMovie) {
        return foundMovie;
      }
    }
  } catch (error) {
    console.warn('[Metadata] Falha ao consultar metadados online', error);
  }

  const subtitle =
    parsed.kind === 'series' && parsed.season && parsed.episode
      ? `Temporada ${parsed.season} - Episodio ${parsed.episode}`
      : null;

  return {
    kind: parsed.kind,
    title: parsed.title,
    subtitle,
    imageUrl: null
  };
};
