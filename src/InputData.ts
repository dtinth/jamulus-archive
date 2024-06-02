/** Represents a point-in-time snapshot of a single directory */
export interface DataPoint {
  /** Timestamp of this data point */
  time: string;

  /** The directory name of this data point */
  genre: string;

  /** Servers in this data point */
  list: JamulusExplorerServer[];

  // There are a few other properties prefixed with `_` that are
  // used internally for debugging purposes.
  // They are not documented here and should not be relied upon.
}

/** Direct output from Jamulus Explorer (see `servers.php`) */
export interface JamulusExplorerServer {
  numip: number;
  port: number;
  country: string;
  maxclients: number;
  perm: number;
  name: string;
  ipaddrs: string;
  city: string;
  ip: string;
  ping: number;
  os: string;
  version: string;
  versionsort: string;
  nclients?: number;
  clients?: JamulusExplorerClient[];
  index: number;
}

export interface JamulusExplorerClient {
  chanid: number;
  country: string;
  instrument: string;
  skill: string;
  name: string;
  city: string;
}
