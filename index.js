const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const YAML = require('YAML');

const agents = loadJsonFiles('config/agents');
const objects = loadJsonFiles('config/objects');

if (process.argv.length < 3) {
    console.error('usage: index.js scenario-file [directory]');
    process.exit(1);
}

const scenarioFile = process.argv[2];
const outputDir = process.argv[3];

const scenario = YAML.parseAllDocuments(fs.readFileSync(scenarioFile, 'utf8'));

scenario.forEach( (scene) => {
    const sceneJS = scene.toJS();
    const notification = generateNotification(sceneJS);

    if (outputDir) {
        if (sceneJS['$']) {
            if (! fs.existsSync(`${outputDir}/${sceneJS['$']}`)) {
                fs.mkdirSync(`${outputDir}/${sceneJS['$']}`);
            }
            const id = notification['id'];
            fs.writeFileSync(`${outputDir}/${sceneJS['$']}/${id}.jsonld`, JSON.stringify(notification,null,2));
        }
        else {
            const id = notification['id'];
            fs.writeFileSync(`${outputDir}/${id}.jsonld`, JSON.stringify(notification,null,2));
        }
    }
    else {
        console.log(JSON.stringify(notification,null,2));
    }

    objects.push(notification);
});

function loadJsonFiles(path) {
    const res = [];
    const files = fs.readdirSync(path);

    files.forEach(file => {
        if (file.endsWith('.json')) {
            res.push(JSON.parse(fs.readFileSync(path + '/' + file)));
        }
    });

    return res;
}

function genid() {
    return 'urn:uuid' + uuidv4();
}

function generateNotification(param) {

    const notification = {
        "@context": [
            "https://www.w3.org/ns/activitystreams",
            "https://purl.org/coar/notify"
        ]   
    };

    const actor   = resolveAgent(param['actor']);
    const origin  = resolveAgent(param['origin']);
    const target  = resolveAgent(param['target']);
    const object  = resolveObject(param['object']); 
    const context = resolveObject(param['context']); 
    const inReplyTo = resolveNotification(param['inReplyTo']);

    if (param['id']) {
        notification['id'] = param['id'];
    }

    if (param['type']) {
        notification['type'] = param['type'];
    }

    if (actor) {
        notification['actor'] = actor;
    }

    if (origin) {
        notification['origin'] = actor; 
    }

    if (context) {
        notification['context'] = context;
    }

    if (inReplyTo) {
        notification['inReplyTo'] = inReplyTo;
    }

    if (object) {
        notification['object'] = object;
    }

    if (target) {
        notification['target'] = target;
    }

    return notification;
}

function resolveAgent(id) {
    if (!id) {
        return undefined;
    }
    return agents.find( (elm) => {
        return elm['id'] = id;
    });
}

function resolveObject(id) {
    if (!id) {
        return undefined;
    }

    const res = objects.find( (elm) => {
        return elm['id'] == id;
    });

    return res ? res : id ;
}

function resolveNotification(id) {
    if (!id) {
        return undefined;
    }
    return id;
}