const log4js = require('log4js');
const logger = log4js.getLogger();
const dataLogger = log4js.getLogger('data');
logger.level = 'debug';
dataLogger.level = 'info';

module.exports = {
    logger:logger,
    dataLogger:dataLogger
}