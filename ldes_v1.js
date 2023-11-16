const fs = require('fs');

exports.generateLDES = function (dir) {
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
    const path = dir.replace('\/[^\/]+$','');
    const subdir = dir.replace(/.*\//g,'');
    const id = `http://localhost:3000/${subdir}.jsonld`;
    const ldes = {
        "@context" : {
            "ldes" : "https://w3id.org/ldes#",
            "tree" : "https://w3id.org/tree#",
            "ldp" : "http://www.w3.org/ns/ldp#",
            "dc" : "http://purl.org/dc/elements/1.1/",
            "ov" : "http://open.vocab.org/terms/",
            "tree:member": { "@container": "@list"}
         } ,
         "@id": `${id}#EventStream`,
         "@type": [ 
            "ldes:EventStream" , 
            "evt:EventLog" 
         ],
         "tree:view" : {
            "@type": "tree:Node" ,
            "tree:viewDescription": {
                "@type": "tree:ViewDescription" ,
                "ldes:managedBy": {
                    "@type": "ldes:LDESinLDPClient" 
                }
            },
            "tree:relation" : {
                "@type": "tree:GreaterThanOrEqualToRelation" ,
                "tree:node" : `http://localhost:3000/${subdir}/`
            }
         }
    };

    console.log(`generating ${path}.jsonld`);
    fs.writeFileSync(`${path}.jsonld`,JSON.stringify(ldes,null,2));
}