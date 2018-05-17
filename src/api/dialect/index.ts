import MSSQL from './mssql';
import MySQL from './mysql';
import PostgreSQL from './pgsql';

const INCLUDE_ORACLEDB = false;
let OracleDB;
if (INCLUDE_ORACLEDB) {
  OracleDB = require('./oracledb');
}

const dialects = {
  MSSQL,
  MySQL,
  PostgreSQL,  
  ...(INCLUDE_ORACLEDB ? {OracleDB} : {}),  
};

export default dialects;
