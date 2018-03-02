import {
  ConnectionCredentials,
  ConnectionDialect,
  DatabaseInterface,
  DialectQueries,
} from './../interface';
import Utils from './../utils';
import Process from '../../languageserver/utils/process';
import path = require('path');
import Logger from './';

export default class SQLiteUSQL implements ConnectionDialect {
  public connection: Promise<any>;
  private binPath: string;
  private queries: DialectQueries = {
    describeTable: 'PRAGMA table_info(:table)',

    // TODO: check this queries below
    fetchColumns: `SELECT TABLE_NAME AS tableName,
        COLUMN_NAME AS columnName,
        DATA_TYPE AS type,
        CHARACTER_MAXIMUM_LENGTH AS size,
        TABLE_SCHEMA as tableSchema,
        TABLE_CATALOG AS tableCatalog,
        DATABASE() as dbName,
        COLUMN_DEFAULT as defaultValue,
        IS_NULLABLE as isNullable
      FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE()`,
    fetchRecords: 'SELECT * FROM :table LIMIT :limit',
    fetchTables: `SELECT
        C.TABLE_NAME AS tableName,
        C.TABLE_SCHEMA AS tableSchema,
        C.TABLE_CATALOG AS tableCatalog,
        (CASE WHEN T.TABLE_TYPE = 'VIEW' THEN 1 ELSE 0 END) AS isView,
        DATABASE() AS dbName,
        COUNT(1) AS numberOfColumns
      FROM
        INFORMATION_SCHEMA.COLUMNS AS C
        JOIN INFORMATION_SCHEMA.TABLES AS T ON C.TABLE_NAME = T.TABLE_NAME
        AND C.TABLE_SCHEMA = T.TABLE_SCHEMA
        AND C.TABLE_CATALOG = T.TABLE_CATALOG
      WHERE T.TABLE_SCHEMA = DATABASE()
      GROUP by
        C.TABLE_NAME,
        C.TABLE_SCHEMA,
        C.TABLE_CATALOG,
        T.TABLE_TYPE
      ORDER BY
        C.TABLE_NAME;`,
  } as DialectQueries;
  constructor(public credentials: ConnectionCredentials) {

  }

  public open() {
    return Promise.resolve(true);
  }

  public close() {
    return Promise.resolve();
  }

  public query(query: string): Promise<DatabaseInterface.QueryResults[]> {
    const queries = query.split(/\s*;\s*(?=([^']*'[^']*')*[^']*$)/g);
    return Process.run(this.getBinPath(), [this.getDbUri(), '-c', query])
    .then(({ result }) => {
      return [
        {
          results: result.split('\n').map((a) => ({ col1: a })),
          cols: ['col1'],
          query,
          messages: [],
        },
      ];
    })
    .catch(({ error }) => Promise.reject(error));
  }

  public getTables(): Promise<DatabaseInterface.Table[]> {
    return Promise.resolve([]);

    // return this.query(this.queries.fetchTables)
    //   .then(([queryRes]) => {
    //     return queryRes.results
    //       .reduce((prev, curr) => prev.concat(curr), [])
    //       .map((obj) => {
    //         return {
    //           name: obj.tableName,
    //           isView: !!obj.isView,
    //           numberOfColumns: parseInt(obj.numberOfColumns, 10),
    //           tableCatalog: obj.tableCatalog,
    //           tableDatabase: obj.dbName,
    //           tableSchema: obj.tableSchema,
    //         } as DatabaseInterface.Table;
    //       })
    //       .sort();
    //   });
  }

  public getColumns(): Promise<DatabaseInterface.TableColumn[]> {
    return Promise.resolve([]);
    // return this.query(this.queries.fetchColumns)
    //   .then(([queryRes]) => {
    //     return queryRes.results
    //       .reduce((prev, curr) => prev.concat(curr), [])
    //       .map((obj) => {
    //         obj.isNullable = !!obj.isNullable ? obj.isNullable.toString() === 'yes' : null;
    //         obj.size = obj.size !== null ? parseInt(obj.size, 10) : null;
    //         obj.tableDatabase = obj.dbName;
    //         return obj as DatabaseInterface.TableColumn;
    //       })
    //       .sort();
    //   });
  }

  public describeTable(table: string) {
    return this.query(Utils.replacer(this.queries.describeTable, { table }));
  }

  public showRecords(table: string, limit: number = 10) {
    return this.query(Utils.replacer(this.queries.fetchRecords, { limit, table }));
  }

  private getDbUri() {
    return `sq:/${path.join(this.credentials.workspace, this.credentials.database

        .replace(/^\.\//, '')
        .replace(/\$\workspaceRoot}/, ''))}`;
  }

  private getBinPath() {
    if (this.binPath) return this.binPath;
    const filename = process.platform === 'win32' ? 'usql.exe' : 'usql';
    this.binPath = path.join(path.dirname(path.dirname(path.dirname(__dirname))), filename);
    return this.binPath;
  }
}
