const mysql = require("mysql");
const config = require("../configs/development/db.config");

class BaseService {
    constructor() {
        this.name = this.constructor.name.replace(`Service`, ``);
        this.table = this.name.toLowerCase();
    }

    static db;
    static connect = () => {
        if (!BaseService.db) {
            BaseService.db = mysql.createPool({
                host: config.HOST,
                port: config.PORT,
                user: config.USER,
                password: config.PASS,
                database: config.NAME,
            });
        }
        return BaseService.db;
    };

    static executeQuery = async (sql, params) => {
        return await new Promise((resolve, reject) => {
            BaseService.connect().query(sql, params, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                return resolve(rows);
            });
        })
            .catch(err => {
                console.error("DB Error", err);
                return err;
            });
    };
    executeQuery = async (sql, params) => {
        return await BaseService.executeQuery(sql, params)
    }

    selectAll = async (params) => {
        let sql = `SELECT * FROM ${this.table} WHERE deleted = 0`;
        if (params?.where) {
            sql += ` AND (${params.where.replaceAll('&&', 'AND').replaceAll('||', 'OR')});`;
        }
        const rows = await BaseService.executeQuery(sql);
        return rows;
    };

    selectOne = async (id) => {
        const sql = `SELECT * FROM ${this.table} WHERE deleted = 0 AND id=${id}`;
        const rows = await BaseService.executeQuery(sql);
        const row = rows.length === 1 ? rows.pop() : null;
        return row;
    };

    insertOneOrMany = async (params) => {
        if (Array.isArray(params)) {
            //INSERT MANY ROWS
            if (params.length === 0) return null;
            const columns = Object.keys([...params].pop()).join(',');
            let allValues = [];
            params.forEach(object => {
                let values = Object.values(object);
                values = values.map((val) => {
                    return (val = "'" + val.replaceAll(/'/g, "''") + "'");
                });
                values = values.join(",");
                allValues.push("(" + values + ")");
            })
            allValues = allValues.join(',');
            const sql = `INSERT INTO ${this.table} (${columns}) VALUES ${allValues};`;
            const result = await BaseService.executeQuery(sql);
            if (result.affectedRows === params.length) {
                return await this.selectAll({ where: `id >= ${result.insertId} && id < ${result.insertId + result.affectedRows}` });
            }
            return false;
        }
        else {
            //INSERT ONE ROW
            const columns = Object.keys(params).join(",");
            let values = Object.values(params);
            values = values.map((val) => {
                return (val = "'" + val.replaceAll(/'/g, "''") + "'");
            });
            values = values.join(",");
            let sql = `INSERT INTO ${this.table} (${columns}) VALUES (${values})`;
            const result = await BaseService.executeQuery(sql);
            if (result.affectedRows === 1) {
                return await this.selectOne(result.insertId);
            }
            return false;
        }
    }

    update = async (params) => {
        console.log(params)
        let where = params.where?.replaceAll('&&', 'AND').replaceAll('||', 'OR') || '1';
        delete params.where;
        let values = [];
        for (const key in params) {
            values.push(`${key}='${params[key].replaceAll(/'/g, "''")}'`);
            //BUG if not string
        }
        values = values.join(',');
        let sql = `UPDATE ${this.table} SET ${values} WHERE ${where}`;
        const result = await BaseService.executeQuery(sql);
        return result;
        //TODO finir le return ...
    }
}

module.exports = BaseService;