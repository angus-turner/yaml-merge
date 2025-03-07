'use strict';
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.cli(),
//  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    //new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ],
});

const readFileSync = require('fs').readFileSync;
const jsYaml = require('js-yaml');
const _ = require('lodash');

function readAsJSON(fileName) {
  const fileBuffer = readFileSync(fileName);
  const fileString = fileBuffer.toString();

  return jsYaml.load(fileString);
}

/**
 * Merge the given YAML file names into a single YAML document
 *
 * @param {array} from the file paths to read from
 * @return {string} the output YAML file
 */
function yamlMerge(...from) {
  const files = from.map((path) => readAsJSON(path));
  const outputJSON = _.mergeWith(files[0],files[1], (objValue, srcValue) => {


    if (Array.isArray(objValue) && Array.isArray(srcValue)) {
      logger.info('srcValue')
      logger.info(srcValue)
      logger.info('objValue')
      logger.info(objValue)

        const newArray = srcValue.filter(item => {
          logger.info(item);
          logger.info(objValue);
          logger.info(objValue.indexOf(item)==-1);
          return objValue.indexOf(item)==-1;
        })

        logger.info(newArray);
        
      return [...objValue, ...newArray].sort();
    }

    // handle it just like with _.merge
    return undefined;
  });

  return jsYaml.dump(outputJSON);
}

module.exports = yamlMerge;
