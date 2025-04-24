import type { Log } from '../models/logs';

export type NewLogDto = Omit<Log, '_id'>;
