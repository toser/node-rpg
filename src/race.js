import {getConfig, getFirstByType, copyObject} from 'helptos';


let config = getConfig('../config/race.json', __dirname);

export let getRace = type => getFirstByType(copyObject(config).templates, type);

export let getRaces = () => Object.keys(config.templates).map((e) => { return config.templates[e].type })
