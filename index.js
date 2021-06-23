'use strict';
const winston = require('winston');
/**
 * winston logger config
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
//  defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        //new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({filename: 'combined.log'}),
        new winston.transports.Console()
    ],
});

const readFileSync = require('fs').readFileSync;
const jsYaml = require('js-yaml');
const _ = require('lodash');

/**
 * read yaml file as a json object
 * @param fileName
 * @returns {*|string}
 */
function readAsJSON(fileName) {
    logger.info(fileName)
    const fileBuffer = readFileSync(fileName);
    const fileString = fileBuffer.toString();

    return jsYaml.load(fileString);
}

/**
 * remove all references of xml from json object
 * @param swaggerVersion2
 * @returns {*}
 */
function cleanupOpenAPI(swaggerVersion2) {
    return deepOmit({"definitions": swaggerVersion2.spec.definitions}, 'xml');
    // return {"definitions": swaggerVersion2.spec.definitions};
}

/**
 * recursive method to remove obj with given keys from provided json
 * @param obj
 * @param keysToOmit
 * @returns {*}
 */
function deepOmit(obj, keysToOmit) {
    let keysToOmitIndex = _.keyBy(Array.isArray(keysToOmit) ? keysToOmit : [keysToOmit]); // create an index object of the keys that should be omitted

    function omitFromObject(obj) { // the inner function which will be called recursivley
        return _.transform(obj, function (result, value, key) { // transform to a new object
            if (key in keysToOmitIndex) { // if the key is in the index skip it
                return;
            }

            result[key] = _.isObject(value) ? omitFromObject(value) : value; // if the key is an object run it through the inner function - omitFromObject
        })
    }
    return omitFromObject(obj); // return the inner function result
}

/**
 * ripped off function for merging yaml files
 * removes duplicate values form yaml lists
 * sorts the yaml list.
 * @param doc1
 * @param doc2
 * @returns {string}
 */
function yamlMerge(doc1, doc2) {
    const outputJSON = _.mergeWith(doc1, doc2, (objValue, srcValue) => {
        if (Array.isArray(objValue) && Array.isArray(srcValue)) {

            const newArray = srcValue.filter(item => {
                return objValue.indexOf(item) == -1;
            })

            return [...objValue, ...newArray].sort();
        }

        // handle it just like with _.merge
        return undefined;
    });

    return jsYaml.dump(outputJSON);
}

/**
 * Merge the given YAML file names into a single YAML document
 *
 * @param {array} from the file paths to read from
 * @return {string} the output YAML file
 */
function yamlMergeFromPath(...from) {
    const files = from.map((path) => readAsJSON(path));
    return yamlMerge(files[0], files[1]);
}


module.exports = {yamlMerge, readAsJSON, cleanupOpenAPI, logger};
