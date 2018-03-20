import MSSQL from './mssql';
import MySQL from './mysql';
import PostgreSQL from './pgsql';
import SQLiteUSQL from './sqlite-usql';

const dialects: {
  MSSQL,
  MySQL,
  PostgreSQL,
  SQLiteUSQL,
  getInternalName?: Function,
  getType?: Function,
} = {
  MSSQL,
  MySQL,
  PostgreSQL,
  SQLiteUSQL,
};

Object.defineProperty(dialects, 'getInternalName', {
  enumerable: false,
  value: (dialect) => dialect.replace(' (via usql)', 'USQL'),
});

Object.defineProperty(dialects, 'getType', {
  enumerable: false,
  value: (dialect) => dialect.replace(' (via usql)', ''),
});

export default dialects;
