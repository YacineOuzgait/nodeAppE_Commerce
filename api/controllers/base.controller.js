const services = require('../services');

class BaseController {
    
  constructor() {
    this.name = this.constructor.name.replace(`Controller`, ``);
    this.table = this.name.toLowerCase();
    this.service = new services[this.table]();
  }

  getAll = async (params) => {
    const result = await this.service.selectAll(params);
    return result;
  };

  getOne = async (id) => {
    const result = await this.service.selectOne(id);
    return result;
  };

  createOne = async (params) => {
    const result = await this.service.insertOneOrMany(params);
    return result;
  };

  updateWhere = async (params) => {
    const result = await this.service.update(params);
    return result;
  };

  deleteOne = async (id) => {
    return `delete one ${this.table} row with id=${id}`;
  };
}
module.exports = BaseController;