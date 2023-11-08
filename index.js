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
        let dirs = ['data','service'];

        if (sceneJS['$']) {
            dirs = sceneJS['$'] instanceof Array ? sceneJS['$'] : [sceneJS['$']]; 
        }

        dirs.forEach( (subdir) => {
            generateDir(`${outputDir}/${subdir}`);
            const id = notification['id'].replace(/:/g,'-');
            console.error(`generating ${outputDir}/${subdir}/${id}.jsonld`);
            fs.writeFileSync(`${outputDir}/${subdir}/${id}.jsonld`, JSON.stringify(notification,null,2));
        });
    }
    else {
        console.log(JSON.stringify(notification,null,2));
    }

    objects.push(notification);
});

generateLDES(outputDir);

function generateLDES(dir) {
    console.log(`generating ldes for ${dir}...`);

    fs.readdir(dir, (err,files) => {
        if (err) 
            throw err;

        files.forEach( (file) => {
            const stats = fs.statSync(`${dir}/${file}`);
            if (stats.isDirectory() && file.match(/^[A-Za-z0-9]/)) {
                _generateLDES(`${dir}/${file}`);
            }
        });
    });
}

function _generateLDES(dir) {
    const subdir = dir.replace(/.*\//g,'');
    const ldes = {
        "@context" : {
            "ldes" : "https://w3id.org/ldes#",
            "tree" : "https://w3id.org/tree#",
            "ldp" : "http://www.w3.org/ns/ldp#",
            "dc" : "http://purl.org/dc/elements/1.1/",
            "ov" : "http://open.vocab.org/terms/",
            "tree:member": { "@container": "@list"}
         } ,
         "@id": `http://localhost:3000/${subdir}/ldes.jsonld#EventStream`,
         "@type": [ "ldes:EventStream" , "evt:EventLog" ],
         "tree:member": []
    };

    fs.readdir(dir, (err,files) => {
        if (err)
            throw err

        files.forEach( file => {
            if (!file.match(/jsonld$/) || file == 'ldes.jsonld')
                return;
            
            const stats = fs.statSync(`${dir}/${file}`);
            const modified = (new Date(stats.mtime)).toISOString();
            ldes['tree:member'].push({
                "@id": file,
                "@type": [ "ldp:Resource" , "evt:Notification" ],
                "dc:modified": modified
            });
        });

        fs.writeFileSync(`${dir}/ldes.jsonld`,JSON.stringify(ldes,null,2));
    });
}

function generateDir(dir) {
    if (! fs.existsSync(dir)) {
        const subdir = dir.replace(/.*\//g,'');
        fs.mkdirSync(dir);
        fs.writeFileSync(`${dir}/.meta`,
        `<http://localhost:3000/${subdir}/> <https://w3id.org/ldes#EventStream> <http://localhost:3000/${subdir}/ldes.jsonld#EventStream> .`
        );
    }
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
