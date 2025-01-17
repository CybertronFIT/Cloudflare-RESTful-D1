// copyright 2023 © Xron Trix | https://github.com/Xrontrix10

import { Env } from '..';
import { customAlphabet } from 'nanoid';
import { returnJson, notFound, serverError, dataConflict } from '../handler/responses';

const customAlphabetChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generateCustomID = customAlphabet(customAlphabetChars, 6);


export function convertToJSON(data: any): any {
  const [id, collection, results, time, success] = data;
  return JSON.stringify({ id: id, collection: collection, results: results, time: time, success: success });
}


export async function getDataByTable(env: Env, table: string): Promise<any> {

  try {
    const stmt = env.DB.prepare(`SELECT * FROM ${table}`);
    const { results, success, meta } = await stmt.all();
    return convertToJSON([null, table, results, meta.duration, success]);
  }

  catch (e) {
    return null;
  }
}


// Custom Function to get Row data by selecting Column
export async function getRowByCol(env: Env, colName: string, colVal: string, table: string): Promise<any> {
  const sql = `SELECT * FROM ${table} WHERE ${colName} = ?1`;
  try {
    const stmt = env.DB.prepare(sql).bind(colVal);
    const { results, success, meta } = await stmt.all();
    if (results.length === 0) {
      return [false, false];
    }

    const idArray = results.map(item => item.id); // Create an array of IDs of results
    return [true, convertToJSON([idArray, table, results, meta.duration, success])];
  }

  catch (error) {
    return [true, null];
  }
};

// Function to retrieve Row by ID from the D1 store
export async function getRowByID(env: Env, id: string, table: string): Promise<any> {

  const [exists, results] = await getRowByCol(env, "id", id, table);

  if (exists && results) {
    return returnJson(results);
  }
  else if (!exists) {
    return notFound();
  }
  else {
    return serverError();
  }
};

// Function to update data by id in the D1 store
export async function updateRowById(env: Env, id: string, updatedData: any, table: string): Promise<any> {

  // Check If Row Exists
  const [exists, _] = await getRowByCol(env, "id", id, table);
  if (!exists) {
    return notFound();
  }
  // Construct the SET clause of the SQL query
  const setClause = Object.keys(updatedData)
    .map((key) => `${key} = ?`)
    .join(', ');

  // Extract the values from updatedData
  const values = Object.values(updatedData);

  // Construct and execute the UPDATE SQL query
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`; // Assuming there's an 'id' column for the record
  values.push(id);

  try {
    const { success, meta } = await env.DB.prepare(sql).bind(...values).run();
    return returnJson(convertToJSON([id, table, updatedData, meta.duration, success]));
  } catch (e) {
    console.error(e);
    return serverError();
  }
};


// Function to insert new data in the D1 store
export async function insertRowInTable(env: Env, newData: any, table: string) {

  const sql_values = Object.values(newData);
  let dataArray = [];
  let dataIndex = -1;
  let dataId = generateCustomID();
  let insert_sql = `INSERT INTO ${table} (id, `;
  let create_sql = `CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, `;
  let existingData = null;

  try {
    const stmt = env.DB.prepare(`SELECT * FROM ${table}`);
    const { results } = await stmt.all();
    existingData = JSON.stringify(results);
  } catch (error) {
    console.error(error);
  }

  if (existingData) { // if data fetch was successful
    dataArray = JSON.parse(existingData);
  }

  // Data duplication check
  if (existingData && (table === 'Faculties' || table === 'Members' || table === 'Participants')) {

    dataIndex = dataArray.findIndex( // Check for Duplicate existing data with same mobile
      (data_t: { mobile: any; }) => data_t.mobile === newData.mobile,
    );

    if (dataIndex !== -1) {
      return dataConflict();
    }
  }
  else if (existingData && table === 'Events') {

    dataIndex = dataArray.findIndex( // Check for Duplicate existing event with same page
      (data_t: { page: any; }) => data_t.page === newData.page,
    );

    if (dataIndex !== -1) {
      return dataConflict();
    }
  }
  else if (existingData && table === 'Teams') {
    dataIndex = dataArray.findIndex( // Check for Duplicate existing event with same page
      (data_t: { paymentID: any; }) => data_t.paymentID === newData.paymentID,
    );

    if (dataIndex !== -1) {
      return dataConflict();
    }
  }

  // Check for ID Duplication and prepare SQl Commands
  if (table === 'Members') {

    dataId = "MEM#" + dataId;
    do {
      dataId = "MEM#" + generateCustomID();
    } while (dataArray.some((every_data: { id: string; }) => every_data.id === dataId))

    create_sql += "name TEXT, role TEXT, image TEXT, mobile TEXT, roll TEXT)";
    insert_sql += "name, role, image, mobile, roll) VALUES (?1, ?2, ?3, ?4, ?5, ?6)";
  }

  else if (table === 'Faculties') {

    dataId = "FAC#" + dataId;
    do {
      dataId = "FAC#" + generateCustomID();
    } while (dataArray.some((every_data: { id: string; }) => every_data.id === dataId))

    create_sql += "name TEXT, role TEXT, image TEXT, mobile TEXT)";
    insert_sql += "name, role, image, mobile) VALUES (?1, ?2, ?3, ?4, ?5)";
  }

  else if (table === 'Events') {

    dataId = "EVT#" + dataId;
    do {
      dataId = "EVT#" + generateCustomID();
    } while (dataArray.some((every_data: { id: string; }) => every_data.id === dataId))

    create_sql += "title TEXT, page TEXT, image TEXT)";
    insert_sql += "title, page, image) VALUES (?1, ?2, ?3, ?4)";
  }

  else if (table === 'Teams') {

    dataId = "TEM#" + dataId;
    do {
      dataId = "TEM#" + generateCustomID();
    } while (dataArray.some((every_data: { id: string; }) => every_data.id === dataId))

    create_sql += "teamName TEXT, eventName TEXT, paymentID TEXT, screenShot TEXT, newsSource TEXT, teamLeader TEXT, member1 TEXT, member2 TEXT, member3 TEXT)";
    insert_sql += "teamName, eventName, paymentID, screenShot, newsSource, teamLeader, member1, member2, member3) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)";

    while (sql_values.length < 9) {
      sql_values.push("-");
    }
  }

  else if (table === 'Participants') {
    dataId = "PRC#" + dataId;
    do {
      dataId = "PRC#" + generateCustomID();
    } while (dataArray.some((every_data: { id: string; }) => every_data.id === dataId))

    create_sql += "name TEXT, mobile TEXT, email TEXT, year TEXT, department TEXT, college TEXT)";
    insert_sql += "name, mobile, email, year, department, college) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)";
  }

  try {
    await env.DB.exec(create_sql); // Create table if it doesn't exist
    const { success, meta } = await env.DB.prepare(insert_sql).bind(dataId, ...sql_values).run(); // Store the new data in D1
    return returnJson(convertToJSON([dataId, table, null, meta.duration, success]));
  }

  catch (error) {
    console.error(error);
    return serverError();
  }
}

// Function to delete data by ID from the D1 store
export async function deleteRowById(env: Env, id: string, table: string) {
  // Check If Row Exists
  const [exists, _] = await getRowByCol(env, "id", id, table);
  if (!exists) {
    return notFound();
  }

  try {
    const { success, meta } = await env.DB.prepare(`DELETE FROM ${table} WHERE id = '${id}'`).run();
    // Return results to indicate successful deletion
    return returnJson(convertToJSON([id, table, null, meta.duration, success]));
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function dropEntireTable(env: Env, table: string) {

  try {
    const { success, meta } = await env.DB.prepare(`DROP TABLE IF EXISTS ${table}`).run();
    // Return results to indicate successful deletion
    return returnJson(convertToJSON([null, table, null, meta.duration, success]));
  }

  catch (error) {
    console.error(error);
    return serverError();
  }
}