import { DatabaseDialect } from './settings';

export default interface ConnectionCredentials {
  name: string;
  server: string;
  port: number;
  database?: string;
  domain?: string;
  username: string;
  password?: string;
  askForPassword?: boolean;
  dialect: DatabaseDialect;
  dialectOptions?: { encrypt: boolean, [x: string]: any };
  connectionTimeout?: number;
  workspace?: string;
}
