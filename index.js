const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const ldes = require('./ldes_v1');
const YAML = require('yaml');
const prom = require('timers/promises');
const commander = require('commander');

commander
    .version('1.0.0','-v, --version')
    .argument('<scenario>')
    .argument('[<directory]')
    .option('-b, --baseUrl <url>', 'Solid base url', 'http://localhost:3000')
    .option('-c, --config <directory>', 'Configuration directory', __dirname + '/config')
    .parse(process.argv);

const options = commander.opts();

const baseUrl = options.baseUrl; 
const agents  = loadJsonFiles(options.config + '/agents');
const objects = loadJsonFiles(options.config + '/objects');

const sleep = t => new Promise(res => setTimeout(res, t))

const scenarioFile = commander.args[0]
const outputDir = commander.args[1];

const scenario = YAML.parseAllDocuments(fs.readFileSync(scenarioFile, 'utf8'));

doit();

async function doit() {
    for (let s = 0 ; s < scenario.length ; s++) {
        const scene = scenario[s];
        const sceneJS = scene.toJS();
        const notification = generateNotification(sceneJS);

        if (fs.existsSync(outputDir)) {
            let dirs = ['data','service'];

            if (sceneJS['$']) {
                dirs = sceneJS['$'] instanceof Array ? sceneJS['$'] : [sceneJS['$']]; 
            }

            for (let i = 0 ; i < dirs.length ; i++) {
                const subdir = dirs[i];

                generateDir(`${outputDir}/${subdir}`);
                const id = notification['id'].replace(/:/g,'-');

                await prom.setTimeout(500);
                console.error(`waiting 500ms`);

                console.error(`generating ${outputDir}/${subdir}/${id}.jsonld`);
                fs.writeFileSync(`${outputDir}/${subdir}/${id}.jsonld`, JSON.stringify(notification,null,2));
            }
        }
        else {
            console.log(JSON.stringify(notification,null,2));
        }

        objects.push(notification);
    }
}

if (fs.existsSync(outputDir)) {
    ldes.generateLDES(outputDir,baseUrl);
}

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

    if (param['@context']) {
        notification['@context'] = param['@context'];
    }

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
        notification['origin'] = origin; 
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

function generateDir(dir) {
    const subdir = dir.replace(/.*\//g,'');

    if (! fs.existsSync(dir)) {
        fs.mkdirSync(dir , { recursive: true });
    }

    fs.writeFileSync(`${dir}/.meta`,
        `<${baseUrl}/${subdir}/> <https://w3id.org/ldes#EventStream> <${baseUrl}/${subdir}.jsonld#EventStream> .`
    );
}

function resolveAgent(id) {
    if (!id) {
        return undefined;
    }
    return agents.find( (elm) => {
        return elm['id'] == id;
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
