export function prepareDatabase(db) {
   db.exec(`CREATE TABLE IF NOT EXISTS links(
      id VARCHAR PRIMARY KEY,
      url VARCHAR
   )`);
}